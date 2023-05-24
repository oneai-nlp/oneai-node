import {
  Skill, Input, File, _Input, Output, AsyncApiTask, AsyncApiResponse, isFile,
} from '../model/pipeline';
import Logger from '../logging';
import { HttpApiClient, ApiReqParams } from './client';
import {
  buildAsyncApiResponse, buildOutput, buildRequest,
} from './mapping';

export default class PipelineApiClient {
  private client: HttpApiClient;

  logger?: Logger;

  rootPath = 'api/v0/pipeline';

  constructor(client: HttpApiClient, logger?: Logger) {
    this.client = client;
    this.logger = logger;
  }

  async postPipeline(
    input: Input,
    skills: Skill[],
    params?: ApiReqParams,
  ): Promise<Output | AsyncApiTask> {
    // sync is true by default
    const sync = params?.sync !== false;
    // handle async file upload
    if (isFile(input.text) && params?.sync !== true) {
      return this.postFile(input as _Input<File>, skills, params);
    }
    const response = await this.client.post(
      this.rootPath + (sync ? '' : '/async'),
      buildRequest(input, skills, true, params?.multilingual || this.client.params.multilingual),
      params,
    );

    return sync ? buildOutput(skills, response.data, response.headers) : {
      id: response.data.task_id,
      name: '',
      skills,
    };
  }

  async postFile(
    input: _Input<File>,
    skills: Skill[],
    params?: ApiReqParams,
  ): Promise<Output | AsyncApiTask> {
    // sync is false by default
    const sync = params?.sync === true;
    const request = buildRequest(
      input,
      skills,
      false,
      params?.multilingual || this.client.params.multilingual,
    );
    if (!sync) this.logger?.debug(`Uploading file ${input.text.filePath}`);
    const response = await this.client.post(
      `${this.rootPath}${sync ? '' : '/async'}/file?pipeline=${encodeURIComponent(request)}`,
      input.text.buffer!,
      params,
    );
    if (!sync) this.logger?.debugNoNewline(`Upload of file ${input.text.filePath} complete\n`);
    return sync ? buildOutput(skills, response.data, response.headers) : {
      id: response.data.task_id,
      name: input.text.filePath,
      skills,
    };
  }

  async getTaskStatus(
    task: AsyncApiTask,
    params?: ApiReqParams,
  ): Promise<AsyncApiResponse> {
    const response = await this.client.get(
      `${this.rootPath}/async/tasks/${task.id}`,
      params,
    );

    return buildAsyncApiResponse(task, response.data, response.headers);
  }
}
