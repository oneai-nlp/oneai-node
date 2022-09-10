import {
  Skill, Input, FileContent, _Input, Output, AsyncApiTask, AsyncApiResponse,
} from '../classes';
import { ApiClient, ApiReqParams } from './client';
import {
  buildAsyncApiResponse, buildOutput, buildRequest,
} from './mapping';

export default class PipelineApiClient extends ApiClient {
  rootPath = 'api/v0/pipeline';

  async postPipeline(
    input: Input,
    skills: Skill[],
    params?: ApiReqParams,
  ): Promise<Output> {
    const { data } = await this.post(
      this.rootPath,
      buildRequest(input, skills, true),
      params,
    );
    return buildOutput(skills, data);
  }

  async postAsyncFile(
    input: _Input<FileContent>,
    skills: Skill[],
    params?: ApiReqParams,
  ): Promise<AsyncApiTask> {
    const request = buildRequest(input, skills, false);
    const { data } = await this.post(
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
    const { data } = await this.get(
      `${this.rootPath}/async/tasks/${task.id}`,
      params,
    );

    return buildAsyncApiResponse(task, data);
  }
}
