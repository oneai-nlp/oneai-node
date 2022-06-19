import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { stdout, stderr } from 'process';
import {
  Skill, Input, Output, Label,
} from './classes';
import { version } from '../package.json';

const MAX_CONCURRENT_REQUESTS = 2;

const uuid = (() => {
  const filePath = `${__dirname}/.uuid`;
  let result = '';
  if (fs.existsSync(filePath)) {
    result = fs.readFileSync(filePath, 'utf8');
  } else {
    result = uuidv4().replace(/-/g, '');
    fs.writeFileSync(filePath, result);
  }
  return result;
})();

function prepInput(skills: Skill[]): object[] {
  let input = 0;
  return skills.map((skill, id) => {
    const prepped = {
      skill: skill.apiName,
      id,
      input,
      params: skill.params,
    };
    if (skill.isGenerator) input++;
    return prepped;
  });
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

  function build(outputIndex: number, skills: Skill[]): Output {
    const result: Output = { text: output.output[outputIndex].text };
    const { labels } = output.output[outputIndex];

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
  input: string | Input,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
): Promise<Output> {
  if (!apiKey) throw new Error('API key is required');
  return axios({
    method: 'POST',
    url: 'https://api.oneai.com/api/v0/pipeline',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': `node-sdk/${version}/${uuid}`,
    },
    data: JSON.stringify({
      input: (typeof (input) === 'string') ? input : input.getText(),
      input_type: (typeof (input) === 'string') ? 'article' : input.type,
      encoding: (typeof (input) === 'string') ? undefined : input.encoding,
      content_type: (typeof (input) === 'string') ? undefined : input.contentType,
      steps: prepInput(skills),
    }, (_, value) => value ?? undefined),
    timeout,
  }).then((response) => prepOutput(skills, response.data));
}

function timeFormat(time: number) {
  const millies = Math.floor(time % 1000);
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${(minutes > 0) ? `${minutes}m ` : ''}${seconds % 60}s ${millies}ms`;
}

export async function sendBatchRequest(
  inputs: Iterable<string | Input>,
  skills: Skill[],
  apiKey?: string,
  timeout?: number,
  printProgress = true,
): Promise<Map<string | Input, Output>> {
  const outputs = new Map<string | Input, Output>();

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
        outputs.set(value!, await sendRequest(value!, skills, apiKey, timeout));
      } catch (e: any) {
        errors++;
        if (printProgress) stderr.write(`\r\033[KInput ${outputs.size + errors}:`);
        stderr.write(e?.message);
      } finally {
        const timeDelta = Date.now() - timeStart;
        timeTotal += timeDelta;
        timeStart += timeDelta;
        if (printProgress) stdout.write(`Input ${outputs.size + errors} - ${timeFormat(timeDelta)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed\r`);
      }
      ({ value, done } = generator.next());
    }
  }

  if (printProgress) stdout.write(`Starting processing batch with ${MAX_CONCURRENT_REQUESTS} workers\r`);
  const workers = [...Array(MAX_CONCURRENT_REQUESTS).keys()].map(() => batchWorker());
  return Promise.all(workers).then(() => {
    if (printProgress) stdout.write(`Processed ${outputs.size + errors} - ${timeFormat(timeTotal / outputs.size + errors)}/input - ${timeFormat(timeTotal)} total - ${outputs.size} successful - ${errors} failed\n`);
    return outputs;
  });
}
