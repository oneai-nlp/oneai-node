import fs from 'fs';
import { ApiReqParams } from './api/client';
import PipelineApiClient from './api/pipeline';
import {
  AsyncApiTask,
  Input, Output, Skill, TextContent, wrapContent,
} from './classes';
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
    return this.client.postPipeline(
      wrapContent(text),
      this.steps,
      params,
    );
  }

  async runFile(
    filePath: string,
    params?: ApiReqParams & {
      sync?: boolean,
      interval?: number,
    },
  ): Promise<Output> {
    const input = wrapContent({ filePath, buffer: fs.readFileSync(filePath) });
    if (params?.sync) return this.run(input, params);

    // todo: extend to non-file inputs
    this.client.logger.debug(`Uploading file ${input.text.filePath}`);
    const task = await this.client.postAsyncFile(input, this.steps, params);
    this.client.logger.debugNoNewline(`Upload of file ${input.text.filePath} complete\n`);
    return polling(
      task,
      (t: AsyncApiTask) => this.client.getTaskStatus.call(this.client, t),
      params?.interval || 1,
      this.client.logger,
    );
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
