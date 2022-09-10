/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import {
  Output, AsyncApiResponse, AsyncApiTask,
} from './classes';
import { logger, timeFormat } from './logging';

const MAX_CONCURRENT_REQUESTS = 2;

export async function polling(
  task: AsyncApiTask,
  pollingFn: (task: AsyncApiTask) => Promise<AsyncApiResponse>,
  interval: number = 1,
  loggingEnabled: boolean = true,
): Promise<Output> {
  let response: Partial<AsyncApiResponse> = { status: 'RUNNING' };
  const timeStart = Date.now();
  while (response.status !== 'COMPLETED') {
    response = await pollingFn(task);

    if (loggingEnabled) logger.debugNoNewline(`Processing file ${task.name} - status ${response.status} - ${timeFormat(Date.now() - timeStart)}`);
    if (response.status === 'FAILED') throw response.result;
    await new Promise((f) => setTimeout(f, 1000 * interval));
  }
  if (loggingEnabled) logger.debugNoNewline(`Processing of file ${task.name} complete - took ${timeFormat(Date.now() - timeStart)} total\n`);
  return response.result as Output;
}

export async function batchProcessing<TInput, TOutput>(
  inputs: Iterable<TInput>,
  processingFn: (input: TInput) => Promise<TOutput>,
  onOutput?: (input: TInput, output: TOutput) => void,
  onError?: (input: TInput, error: any) => void,
  loggingEnabled: boolean = true,
): Promise<Map<TInput, TOutput>> {
  const outputs = new Map<TInput, TOutput>();

  const inputDist = (function* inputDist(): Iterator<TInput, void> {
    yield* inputs;
  }());

  let errors = 0;
  let timeTotal = 0;
  async function batchWorker() {
    let { value, done } = inputDist.next();
    let timeStart = Date.now();
    while (!done) {
      if (value !== undefined) {
        try {
          const output = await processingFn(value);
          if (onOutput) onOutput(value, output);
          else outputs.set(value, output);
        } catch (e: any) {
          errors++;
          if (loggingEnabled) {
            logger.error(`Input ${outputs.size + errors}:`);
            logger.error(e?.message);
          }
          if (onError) onError(value, e);
          else outputs.set(value, e);
        } finally {
          const timeDelta = Date.now() - timeStart;
          timeTotal += timeDelta;
          timeStart += timeDelta;
          if (loggingEnabled) logger.debugNoNewline(`Input ${outputs.size + errors} - ${timeFormat(timeDelta)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed`);
        }
      }
      ({ value, done } = inputDist.next());
    }
  }

  if (loggingEnabled) logger.debug(`Starting processing batch with ${MAX_CONCURRENT_REQUESTS} workers`);
  const workers = [...Array(MAX_CONCURRENT_REQUESTS).keys()].map(() => batchWorker());
  return Promise.all(workers).then(() => {
    if (loggingEnabled) logger.debugNoNewline(`Processed ${outputs.size + errors} - ${timeFormat(timeTotal / outputs.size + errors)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed\n`);
    return outputs;
  });
}
