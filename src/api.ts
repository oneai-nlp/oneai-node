import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import {
  Skill, Input, File, isFileContent,
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
  return JSON.stringify({
    ...(includeText && { input: input.text }),
    input_type: input.type,
    encoding: input.encoding,
    content_type: input.contentType,
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
  if (!apiKey) throw new Error('API key is required');

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
      timeout,
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
  input: File,
  skills: Skill[],
  apiKey: string,
  timeout?: number,
): Promise<string> {
  const inputWrapped = (isFileContent(input)) ? new File(input) : input;

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
      data: inputWrapped.text.buffer,
      timeout,
    });

    return data.task_id;
  } catch (error) {
    throw handleError(error);
  }
}
