/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import { stdout, stderr } from 'process';
import {
  Skill, Input, Output, Label, TextContent, File, FileContent, wrapContent, inputType, ConversationContent,
} from './classes';
import { handleError } from './errors';
import { getTaskStatus, postAsyncFile, postPipeline } from './api';

const MAX_CONCURRENT_REQUESTS = 2;

type PipelineInput = TextContent | Input;

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
  sourceType: inputType,
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
    type: inputType,
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
        result[field] = build(outputIndex + 1, nextSkills, type);
        return true;
      }
      result[field] = labels.filter((label: Label) => label.type === skill.labelType);
      return false;
    });

    return result;
  }

  const generator = (output.output[0].text_generated_by_step_id || 0) - 1;
  if (generator < 0) return build(0, steps, sourceType);

  // edge case- first Skill is a generator, or a generator preceded by
  // Skills that didn't generate output. In this case the API will skip these Skills,
  // so we need to create filler objects to match the expected structure
  const [currentSkills, nextSkills] = splitPipeline(steps, generator);
  const result: Output = { text: output.input_text };

  currentSkills.forEach((skill) => {
    const field = skill.outputField || skill.apiName;
    result[field] = (skill.isGenerator) ? build(0, nextSkills, sourceType) : [];
  });
  return result;
}

export async function sendRequest(
  input: PipelineInput,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
): Promise<Output> {
  if (!apiKey) throw new Error('API key is required');
  const inputWrapped = wrapContent(input);

  try {
    const data = await postPipeline(inputWrapped, skills, apiKey, timeout);
    return prepOutput(skills, data, inputWrapped.type);
  } catch (error) {
    throw handleError(error);
  }
}

export async function sendAsyncFileRequestAndWait(
  input: File | FileContent,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
  interval: number = 1,
): Promise<Output> {
  if (!apiKey) throw new Error('API key is required');
  const inputWrapped = wrapContent(input);
  logger.debug(`Uploading file ${inputWrapped.text.filePath}`);
  const taskId = await postAsyncFile(inputWrapped, skills, apiKey, timeout);
  logger.debugNoNewline(`Upload of file ${inputWrapped.text.filePath} complete\n`);

  let response = { status: '', result: undefined };
  const timeStart = Date.now();
  while (response.status !== 'COMPLETED') {
    response = await getTaskStatus(taskId, apiKey);

    logger.debugNoNewline(`Processing file ${inputWrapped.text.filePath} - status ${response.status} - ${timeFormat(Date.now() - timeStart)}`);
    if (response.status === 'FAILED') throw handleError(response.result);
    await new Promise((f) => setTimeout(f, 1000 * interval));
  }
  logger.debugNoNewline(`Processing of file ${inputWrapped.text.filePath} complete - took ${timeFormat(Date.now() - timeStart)} total\n`);
  return prepOutput(skills, response.result, inputWrapped.type);
}

function timeFormat(time: number) {
  const millies = Math.floor(time % 1000);
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${(minutes > 0) ? `${minutes}m ` : ''}${seconds % 60}s ${millies}ms`;
}

export async function sendBatchRequest(
  inputs: Iterable<PipelineInput>,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
  onOutput?: (input: PipelineInput, output: Output) => void,
  onError?: (input: PipelineInput, error: any) => void,
  printProgress = true,
): Promise<Map<PipelineInput, Output>> {
  if (!apiKey) throw new Error('API key is required');
  const outputs = new Map<PipelineInput, Output>();

  const generator = (function* dist() {
    yield* inputs;
  }());

  let errors = 0;
  let timeTotal = 0;
  async function batchWorker() {
    let { value, done } = generator.next();
    let timeStart = Date.now();
    while (!done) {
      try {
        /* eslint-disable no-await-in-loop */ // (since we send requests sequentially)
        const output = await postPipeline(wrapContent(value!), skills, apiKey!, timeout);
        if (onOutput) onOutput(value!, output);
        else outputs.set(value!, output);
      } catch (e: any) {
        errors++;
        if (printProgress) {
          logger.error(`Input ${outputs.size + errors}:`);
          logger.error(e?.message);
        }
        if (onError) onError(value!, e);
        else outputs.set(value!, e);
      } finally {
        const timeDelta = Date.now() - timeStart;
        timeTotal += timeDelta;
        timeStart += timeDelta;
        if (printProgress) logger.debugNoNewline(`Input ${outputs.size + errors} - ${timeFormat(timeDelta)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed`);
      }
      ({ value, done } = generator.next());
    }
  }

  if (printProgress) logger.debug(`Starting processing batch with ${MAX_CONCURRENT_REQUESTS} workers`);
  const workers = [...Array(MAX_CONCURRENT_REQUESTS).keys()].map(() => batchWorker());
  return Promise.all(workers).then(() => {
    if (printProgress) logger.debugNoNewline(`Processed ${outputs.size + errors} - ${timeFormat(timeTotal / outputs.size + errors)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed\n`);
    return outputs;
  });
}
