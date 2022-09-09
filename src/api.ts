import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import {
  Skill, Input, isFileContent, FileContent, _Input,
} from './classes';
import { version } from '../package.json';
import { handleError } from './errors';

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

function buildRequest(input: Input, skills: Skill[], includeText: boolean): string {
  const fixedInput = (isFileContent(input.text) && includeText)
    ? {
      text: input.text.buffer.toString(input.encoding),
      encoding: input.encoding,
      contentType: input.contentType,
      type: input.type,
    } : input;
  return JSON.stringify({
    ...(includeText && { input: fixedInput.text }),
    input_type: fixedInput.type,
    output_type: fixedInput.type === 'conversation' ? 'json' : 'text',
    encoding: fixedInput.encoding,
    content_type: fixedInput.contentType,
    steps: skills.map((skill) => ({
      skill: skill.apiName,
      params: skill.params,
    })),
  }, (_, value) => value ?? undefined);
}

export async function postPipeline(
  input: Input,
  skills: Skill[],
  apiKey: string,
  timeout: number = 6000,
): Promise<any> {
  try {
    const { data } = await axios({
      method: 'POST',
      url: 'https://api.oneai.com/api/v0/pipeline',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': `node-sdk/${version}/${uuid}`,
      },
      data: buildRequest(input, skills, true),
      timeout: timeout * 1000,
    });

    return data;
  } catch (error) {
    throw handleError(error);
  }
}

export async function getTaskStatus(taskId: string, apiKey: string): Promise<any> {
  try {
    const { data } = await axios({
      method: 'GET',
      url: `https://api.oneai.com/api/v0/pipeline/async/tasks/${taskId}`,
      headers: {
        'api-key': apiKey,
        'User-Agent': `node-sdk/${version}/${uuid}`,
      },
    });

    return data;
  } catch (error) {
    throw handleError(error);
  }
}

export async function postAsyncFile(
  input: _Input<FileContent>,
  skills: Skill[],
  apiKey: string,
  timeout: number = 6000,
): Promise<string> {
  try {
    const request = buildRequest(input, skills, false);
    const { data } = await axios({
      method: 'POST',
      url: `https://api.oneai.com/api/v0/pipeline/async/file?pipeline=${encodeURIComponent(request)}`,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': `node-sdk/${version}/${uuid}`,
      },
      data: input.text.buffer,
      timeout: timeout * 1000,
    });

    return data.task_id;
  } catch (error) {
    throw handleError(error);
  }
}
