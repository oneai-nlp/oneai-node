import fs from 'fs';
import { ApiReqParams } from './api/client';
import PipelineApiClient from './api/pipeline';
import {
  AsyncApiTask,
  Input, Output, Skill, TextContent, wrapContent,
} from './classes';
import { logger } from './logging';
import { batchProcessing, polling } from './schedule';

export type PipelineRunParams = ApiReqParams & {
  interval?: number,
  loggingEnabled?: boolean
};

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
    params?: PipelineRunParams & {
      sync?: boolean
    },
  ): Promise<Output> {
    const input = wrapContent({ filePath, buffer: fs.readFileSync(filePath) });
    if (params?.sync) return this.run(input, params);

    // todo: extend to non-file inputs
    if (params?.loggingEnabled !== false) logger.debug(`Uploading file ${input.text.filePath}`);
    const task = await this.client.postAsyncFile(input, this.steps, params);
    if (params?.loggingEnabled !== false) logger.debugNoNewline(`Upload of file ${input.text.filePath} complete\n`);
    return polling(
      task,
      (t: AsyncApiTask) => this.client.getTaskStatus.call(this.client, t),
      params?.interval || 1,
      params?.loggingEnabled || true,
    );
  }

  async runBatch<T extends TextContent | Input>(
    inputs: Iterable<T>,
    params?: PipelineRunParams & {
      onOutput?: (input: T, output: Output) => void,
      onError?: (input: T, error: any) => void,
    },
  ): Promise<Map<T, Output>> {
    return batchProcessing(
      inputs,
      this.run,
      params?.onOutput,
      params?.onError,
      params?.loggingEnabled || true,
    );
  }
}

export const createPipelineClass = (client: PipelineApiClient) => class extends _Pipeline {
  client = client;
};
