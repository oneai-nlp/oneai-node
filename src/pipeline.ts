import { ApiReqParams } from './api/client';
import PipelineApiClient from './api/pipeline';
import {
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
  ): Promise<Output> {
    const input = wrapContent(text);
    const response = await this.client.postPipeline(
      input,
      this.steps,
      params,
    );

    return isInput(response) ? response as Output
      : polling(
        response as AsyncApiTask,
        (t: AsyncApiTask) => this.client.getTaskStatus.call(this.client, t),
        params?.interval || 1,
        this.client.logger,
      );
  }

  async runFile(
    filePath: string,
    params?: ApiReqParams,
  ): Promise<Output> {
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
}

const createPipelineClass = (client: PipelineApiClient) => class extends _Pipeline {
  client = client;
};

export default createPipelineClass;
