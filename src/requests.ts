/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import { stdout, stderr } from 'process';
import {
  Skill, Input, Output, FileContent, _Input,
} from './classes';
import { handleError } from './errors';
import { getTaskStatus, postAsyncFile, postPipeline } from './api/pipeline';
import { buildOutput } from './api/output';

const MAX_CONCURRENT_REQUESTS = 2;

class logger {
  static prefix = '\x1b[34m●\x1b[36m▲\x1b[35m▮\x1b[0m ';

  static debug(message: string) {
    stdout.write(logger.prefix + message);
  }

  static debugNoNewline(message: string) {
    stdout.clearLine(0);
    stdout.cursorTo(0);
    stdout.write(logger.prefix + message);
  }

  static error(message: string) {
    stderr.write(`${message}\n`);
  }
}

export async function sendRequest(
  input: Input,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
): Promise<Output> {
  if (!apiKey) throw new Error('API key is required');

  try {
    const data = await postPipeline(input, skills, apiKey, timeout);
    return buildOutput(skills, data);
  } catch (error) {
    throw handleError(error);
  }
}

export async function sendAsyncFileRequestAndWait(
  input: _Input<FileContent>,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
  interval: number = 1,
): Promise<Output> {
  if (!apiKey) throw new Error('API key is required');

  logger.debug(`Uploading file ${input.text.filePath}`);
  const taskId = await postAsyncFile(input, skills, apiKey, timeout);
  logger.debugNoNewline(`Upload of file ${input.text.filePath} complete\n`);

  let response = { status: '', result: undefined };
  const timeStart = Date.now();
  while (response.status !== 'COMPLETED') {
    response = await getTaskStatus(taskId, apiKey);

    logger.debugNoNewline(`Processing file ${input.text.filePath} - status ${response.status} - ${timeFormat(Date.now() - timeStart)}`);
    if (response.status === 'FAILED') throw handleError(response.result);
    await new Promise((f) => setTimeout(f, 1000 * interval));
  }
  logger.debugNoNewline(`Processing of file ${input.text.filePath} complete - took ${timeFormat(Date.now() - timeStart)} total\n`);
  return buildOutput(skills, response.result);
}

function timeFormat(time: number) {
  const millies = Math.floor(time % 1000);
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${(minutes > 0) ? `${minutes}m ` : ''}${seconds % 60}s ${millies}ms`;
}

export async function sendBatchRequest(
  inputs: Iterator<Input, void>,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
  onOutput?: (input: Input, output: Output) => void,
  onError?: (input: Input, error: any) => void,
  printProgress = true,
): Promise<Map<Input, Output>> {
  if (!apiKey) throw new Error('API key is required');
  const outputs = new Map<Input, Output>();

  let errors = 0;
  let timeTotal = 0;
  async function batchWorker() {
    let { value, done } = inputs.next();
    let timeStart = Date.now();
    while (!done) {
      if (value !== undefined) {
        try {
          const output = await postPipeline(value, skills, apiKey!, timeout);
          if (onOutput) onOutput(value, output);
          else outputs.set(value, output);
        } catch (e: any) {
          errors++;
          if (printProgress) {
            logger.error(`Input ${outputs.size + errors}:`);
            logger.error(e?.message);
          }
          if (onError) onError(value, e);
          else outputs.set(value, e);
        } finally {
          const timeDelta = Date.now() - timeStart;
          timeTotal += timeDelta;
          timeStart += timeDelta;
          if (printProgress) logger.debugNoNewline(`Input ${outputs.size + errors} - ${timeFormat(timeDelta)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed`);
        }
      }
      ({ value, done } = inputs.next());
    }
  }

  if (printProgress) logger.debug(`Starting processing batch with ${MAX_CONCURRENT_REQUESTS} workers`);
  const workers = [...Array(MAX_CONCURRENT_REQUESTS).keys()].map(() => batchWorker());
  return Promise.all(workers).then(() => {
    if (printProgress) logger.debugNoNewline(`Processed ${outputs.size + errors} - ${timeFormat(timeTotal / outputs.size + errors)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed\n`);
    return outputs;
  });
}
