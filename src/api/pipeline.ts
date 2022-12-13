import {
  Skill, Input, File, _Input, Output, AsyncApiTask, AsyncApiResponse,
} from '../classes';
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
  ): Promise<Output> {
    const response = await this.client.post(
      this.rootPath,
      buildRequest(input, skills, true),
      params,
    );

    return buildOutput(skills, response.data, response.headers);
  }

  async postAsyncFile(
    input: _Input<File>,
    skills: Skill[],
    params?: ApiReqParams,
  ): Promise<AsyncApiTask> {
    const request = buildRequest(input, skills, false);
    const { data } = await this.client.post(
      `${this.rootPath}/async/file?pipeline=${encodeURIComponent(request)}`,
      input.text.buffer,
      params,
    );
    return {
      id: data.task_id,
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
