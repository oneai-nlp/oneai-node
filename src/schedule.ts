/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import {
  Output, AsyncApiResponse, AsyncApiTask,
} from './classes';
import { OneAIError } from './errors';
import Logger, { timeFormat } from './logging';

export async function polling(
  task: AsyncApiTask,
  pollingFn: (task: AsyncApiTask) => Promise<AsyncApiResponse>,
  interval: number,
  logger: Logger,
): Promise<Output> {
  let response: Partial<AsyncApiResponse> = { status: 'RUNNING' };
  const timeStart = Date.now();
  while (response.status !== 'COMPLETED') {
    response = await pollingFn(task);

    logger.debugNoNewline(`Processing file ${task.name} - status ${response.status} - ${timeFormat(Date.now() - timeStart)}`);
    if (response.status === 'FAILED') throw response.result;
    await new Promise((f) => setTimeout(f, 1000 * interval));
  }
  logger.debugNoNewline(`Processing of file ${task.name} complete - took ${timeFormat(Date.now() - timeStart)} total\n`);
  return response.result as Output;
}

export interface BatchResponse<TInput, TOutput> {
  outputs: {
    index: number,
    input: TInput,
    output: TOutput,
  }[],

  errors: {
    index: number,
    input: TInput,
    error: OneAIError,
  }[]
}

export async function batchProcessing<TInput, TOutput>(
  inputs: Iterable<TInput>,
  processingFn: (input: TInput) => Promise<TOutput>,
  concurrentReqs: number,
  onOutput?: (input: TInput, output: TOutput) => void,
  onError?: (input: TInput, error: any) => void,
  logger?: Logger,
): Promise<BatchResponse<TInput, TOutput>> {
  const response: BatchResponse<TInput, TOutput> = {
    outputs: [],
    errors: [],
  };

  const inputDist = (function* inputDist(): Iterator<[number, TInput], void> {
    let index = 0;
    for (const input of inputs) yield [index++, input];
  }());

  const lgr = (logger !== undefined) ? logger : new Logger(false);

  let timeTotal = 0;
  async function batchWorker() {
    let { value, done } = inputDist.next();
    let timeStart = Date.now();
    while (!done) {
      const [index, input] = value!;
      try {
        const output = await processingFn(input);
        if (onOutput) onOutput(input, output);
        response.outputs.push({
          index,
          input,
          output,
        });
      } catch (error: any) {
        lgr.error(`\nInput ${index}: ${error?.message}`);
        if (onError) onError(input, error);
        response.errors.push({
          index,
          input,
          error,
        });
      } finally {
        const timeDelta = Date.now() - timeStart;
        timeTotal += timeDelta;
        timeStart += timeDelta;
        lgr.debugNoNewline(`Input ${index} - ${timeFormat(timeDelta)}/input - ${timeFormat(timeTotal)} total - ${response.outputs.length} successful - ${response.errors.length} failed`);
      }
      ({ value, done } = inputDist.next());
    }
  }

  lgr.debug(`Starting processing batch with ${concurrentReqs} workers`);
  const workers = [...Array(concurrentReqs).keys()].map(() => batchWorker());
  return Promise.all(workers).then(() => {
    const size = response.outputs.length + response.errors.length;
    lgr.debugNoNewline(`Processed ${size} inputs - ${timeFormat(timeTotal / size)}/input - ${timeFormat(timeTotal)} total - ${response.outputs.length} successful - ${response.errors.length} failed\n`);
    return response;
  });
}
