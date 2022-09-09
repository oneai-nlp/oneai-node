import fs from 'fs';
import type OneAI from '.';
import {
  Input, Output, Skill, TextContent, wrapContent,
} from './classes';
import { sendAsyncFileRequestAndWait, sendBatchRequest, sendRequest } from './requests';

abstract class _Pipeline {
  abstract client: OneAI;

  steps: Skill[];

  constructor(...steps: Skill[]) {
    this.steps = steps;
  }

  async run(
    text: TextContent | Input,
    params?: {
      apiKey?: string,
      timeout?: number
    },
  ): Promise<Output> {
    return sendRequest(
      wrapContent(text),
      this.steps,
      params?.apiKey || this.client.apiKey,
      params?.timeout,
    );
  }

  async runFile(
    filePath: string,
    params?: {
      apiKey?: string,
      timeout?: number,
      sync?: boolean,
      interval?: number,
    },
  ): Promise<Output> {
    const input = wrapContent({ filePath, buffer: fs.readFileSync(filePath) });
    return (params?.sync) ? sendRequest(
      input,
      this.steps,
      params?.apiKey || this.client.apiKey,
      params?.timeout,
    ) : sendAsyncFileRequestAndWait(
      input,
      this.steps,
      params?.apiKey || this.client.apiKey,
      params?.timeout,
    );
  }

  async runBatch(
    inputs: Iterable<TextContent | Input>,
    params?: {
      apiKey?: string,
      timeout?: number,
      onOutput?: (input: Input, output: Output) => void,
      onError?: (input: Input, error: any) => void,
    },
  ): Promise<Map<Input, Output>> {
    return sendBatchRequest(
      (function* iterInputs(): Iterator<Input> {
        for (const input of inputs) yield wrapContent(input);
      }()),
      this.steps,
      params?.apiKey || this.client.apiKey,
      params?.timeout,
      params?.onOutput,
      params?.onError,
      this.client.printProgress,
    );
  }
}

const Pipeline = (client: OneAI) => class extends _Pipeline { client = client; };
export default Pipeline;
