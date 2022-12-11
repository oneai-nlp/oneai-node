import fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { version } from '../../package.json';
import { buildError } from './mapping';

export interface ApiClientParams {
  apiKey: string;
  baseURL: string;
  timeout: number;
}

export type ApiReqParams = Partial<ApiClientParams>;

export interface ApiResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

export interface ApiClient {
  params: ApiClientParams;

  get(
    path: string,
    params?: ApiReqParams,
  ): Promise<ApiResponse>;

  post(
    path: string,
    data: string | Buffer,
    params?: ApiReqParams,
  ): Promise<ApiResponse>;
}

export class ApiClientAxios implements ApiClient {
  private static readonly uuid = (() => {
    try {
      const filePath = `${__dirname}/.uuid`;
      let result = '';
      if (fs.existsSync(filePath)) {
        result = fs.readFileSync(filePath, 'utf8');
      } else {
        result = uuidv4().replace(/-/g, '');
        fs.writeFileSync(filePath, result);
      }
      return result;
    } catch (e) {
      return 'UUID_DISABLED';
    }
  })();

  private agent: string = `node-sdk/${version}/${ApiClientAxios.uuid}`;

  params: ApiClientParams;

  constructor(params: ApiClientParams) {
    this.params = params;
  }

  async get(
    path: string,
    params?: ApiReqParams,
  ): Promise<ApiResponse> {
    const apiKey = this.validateApiKey(params);
    try {
      return await axios({ // await to throw error if necessary
        url: `${this.params.baseURL}/${path}`,
        method: 'GET',
        headers: {
          'api-key': apiKey,
          'User-Agent': this.agent,
        },
        timeout: (params?.timeout || this.params.timeout) * 1000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
    } catch (error) {
      throw buildError(error);
    }
  }

  async post(
    path: string,
    data: string | Buffer,
    params?: ApiReqParams,
  ): Promise<ApiResponse> {
    const apiKey = this.validateApiKey(params);
    try {
      return await axios({ // await to throw error if necessary
        url: `${this.params.baseURL}/${path}`,
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'User-Agent': this.agent,
          'Content-Type': 'application/json',
        },
        data,
        timeout: (params?.timeout || this.params.timeout) * 1000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
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
