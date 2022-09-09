/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import { stdout, stderr } from 'process';
import {
  Skill, Input, Output, Label, FileContent, ConversationContent, _Input,
} from './classes';
import { handleError } from './errors';
import { getTaskStatus, postAsyncFile, postPipeline } from './api/pipeline';

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

const pattern = /(\d+):(\d+):(\d+).(\d+)/;
function timestampToMilliseconds(timestamp?: string): number | undefined {
  if (!timestamp) return undefined;
  const match = timestamp.match(pattern);
  if (!match) return undefined;
  const numbers = match.map((n) => parseInt(n, 10));
  const [, hour, minute, second, milli] = numbers;
  return (((hour * 60 + minute) * 60 + second)) * 1000 + milli;
}

function prepOutput(
  steps: Skill[],
  output: any,
): Output {
  function splitPipeline(skills: Skill[], i: number): Skill[][] {
    // split pipeline at a generator Skill
    const first = skills.slice(0, i + 1);
    const second = skills.slice(i + 1);
    if (skills[i].outputField1) {
      // handle skills that create both text and labels
      const clone = { ...skills[i] };
      clone.isGenerator = false;
      clone.outputField = clone.outputField1;
      second.unshift(clone);
    }
    return [first, second];
  }

  function build(
    outputIndex: number,
    skills: Skill[],
  ): Output {
    const source = output.output[outputIndex];
    const result: Output = {
      text: 'text' in source ? source.text : (source.contents as ConversationContent),
    };
    const labels: Label[] = source.labels.map((label: any) => ({
      ...label.type && { type: label.type },
      ...label.name && { name: label.name },
      ...label.span && { span: label.span },
      ...label.span_text && { span_text: label.span_text },
      ...label.output_spans && { outputSpans: label.output_spans },
      ...label.input_spans && { inputSpans: label.input_spans },
      ...label.value && { value: label.value },
      ...label.timestamp && { timestamp: timestampToMilliseconds(label.timestamp) },
      ...label.timestamp_end && { timestampEnd: timestampToMilliseconds(label.timestamp_end) },
      data: label.data || {},
    }));

    skills.some((skill, i) => {
      const field = skill.outputField || skill.apiName;
      if (skill.isGenerator) {
        const [, nextSkills] = splitPipeline(skills, i);
        result[field] = build(outputIndex + 1, nextSkills);
        return true;
      }
      result[field] = labels.filter((label: Label) => label.type === skill.labelType);
      return false;
    });

    return result;
  }

  const generator = (output.output[0].text_generated_by_step_id || 0) - 1;
  if (generator < 0) return build(0, steps);

  // edge case- first Skill is a generator, or a generator preceded by
  // Skills that didn't generate output. In this case the API will skip these Skills,
  // so we need to create filler objects to match the expected structure
  const [currentSkills, nextSkills] = splitPipeline(steps, generator);
  const result: Output = { text: output.input_text };

  currentSkills.forEach((skill) => {
    const field = skill.outputField || skill.apiName;
    result[field] = (skill.isGenerator) ? build(0, nextSkills) : [];
  });
  return result;
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
    return prepOutput(skills, data);
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
  return prepOutput(skills, response.result);
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
