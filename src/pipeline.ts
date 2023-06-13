/* eslint-disable no-dupe-class-members */
import { ApiReqParams } from './api/client';
import PipelineApiClient from './api/pipeline';
import {
  AsyncApiResponse,
  AsyncApiTask,
  Input, Output, Skill, TextContent, isInput, wrapContent,
} from './model/pipeline';
import { batchProcessing, BatchResponse, polling } from './schedule';

abstract class _Pipeline {
  abstract client: PipelineApiClient;

  steps: Skill[];

  constructor(...steps: Skill[]) {
    this.steps = steps;
  }

  async run(
    text: TextContent | Input,
    params?: ApiReqParams,
    ): Promise<Output>;

  // polling disabled - return task ID
  async run(
      text: TextContent | Input,
      params: ApiReqParams & {
        polling: false,
      },
    ): Promise<AsyncApiTask>;

  async run(
    text: TextContent | Input,
    params?: ApiReqParams & {
      polling?: boolean,
    },
  ): Promise<Output | AsyncApiTask> {
    const input = wrapContent(text);
    const response = await this.client.postPipeline(
      input,
      this.steps,
      params,
    );

    return isInput(response) || params?.polling === false ? response
      : polling(
        response as AsyncApiTask,
        (t: AsyncApiTask) => this.client.getTaskStatus.call(this.client, t),
        params?.interval || 1,
        this.client.logger,
      );
  }

  async runFile(
    filePath: string,
    params: ApiReqParams & {
      polling: false,
    },
  ): Promise<AsyncApiTask>;

  async runFile(
    filePath: string,
    params?: ApiReqParams,
  ): Promise<Output>;

  async runFile(
    filePath: string,
    params?: ApiReqParams & {
      polling?: boolean,
    },
  ): Promise<Output | AsyncApiTask> {
    return this.run({ filePath }, params);
  }

  async runBatch<T extends TextContent | Input>(
    inputs: Iterable<T>,
    params?: ApiReqParams & {
      maxConcurrentRequests?: number,
      onOutput?: (input: T, output: Output) => void,
      onError?: (input: T, error: any) => void,
    },
  ): Promise<BatchResponse<T, Output>> {
    return batchProcessing(
      inputs,
      (input: T) => this.run(input, params),
      params?.maxConcurrentRequests || 2,
      params?.onOutput,
      params?.onError,
      this.client.logger,
    );
  }

  async taskStatus(task: AsyncApiTask | string): Promise<AsyncApiResponse> {
    const taskObj = (typeof task === 'string') ? { requestId: task, name: '', skills: this.steps } : task;
    return this.client.getTaskStatus(taskObj);
  }

  async awaitTask(task: AsyncApiTask | string, params?: ApiReqParams): Promise<Output> {
    const taskObj = (typeof task === 'string') ? { requestId: task, name: '', skills: this.steps } : task;
    return polling(
      taskObj,
      (t: AsyncApiTask) => this.client.getTaskStatus.call(this.client, t),
      params?.interval || 1,
      this.client.logger,
    );
  }
}

const createPipelineClass = (client: PipelineApiClient) => class extends _Pipeline {
  client = client;
};

export default createPipelineClass;
