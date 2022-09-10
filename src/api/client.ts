import fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { version } from '../../package.json';
import { buildError } from './mapping';
import Logger from '../logging';

export const uuid = (() => {
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

export const agent = `node-sdk/${version}/${uuid}`;

export interface ApiClientParams {
  apiKey: string;
  baseURL: string;
  timeout: number;
}

export type ApiReqParams = Partial<ApiClientParams>;

export class ApiClient {
  private agent: string = `node-sdk/${version}/${uuid}`;

  params: ApiClientParams;

  logger: Logger;

  constructor(params: ApiClientParams, logger: Logger) {
    this.params = params;
    this.logger = logger;
  }

  async get(
    path: string,
    params?: ApiReqParams,
  ): Promise<any> {
    const apiKey = this.validateApiKey(params);
    try {
      return axios({
        url: `${this.params.baseURL}/${path}`,
        method: 'GET',
        headers: {
          'api-key': apiKey,
          'User-Agent': this.agent,
        },
        timeout: (params?.timeout || this.params.timeout) * 1000,
      });
    } catch (error) {
      throw buildError(error);
    }
  }

  async post(
    path: string,
    data: any,
    params?: ApiReqParams,
  ): Promise<any> {
    const apiKey = this.validateApiKey(params);
    try {
      return axios({
        url: `${this.params.baseURL}/${path}`,
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'User-Agent': this.agent,
          'Content-Type': 'application/json',
        },
        data,
        timeout: (params?.timeout || this.params.timeout) * 1000,
      });
    } catch (error) {
      throw buildError(error);
    }
  }

  validateApiKey(params?: ApiReqParams): string {
    const key = params?.apiKey || this.params.apiKey;
    if (!key) throw new Error('missing API key');

    return key;
  }
}
