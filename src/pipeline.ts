import type OneAI from '.';
import {
  Input, Output, Skill, TextContent, File,
} from './classes';
import { sendAsyncFileRequestAndWait, sendBatchRequest, sendFileRequest, sendRequest } from './requests';

interface Pipeline {
  steps: Skill[];
}

function pipeline(client: OneAI) {
  return class implements Pipeline {
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
      return sendRequest(text, this.steps, params?.apiKey || client.apiKey, params?.timeout);
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
      return (params?.sync) ? sendRequest(
        new File(filePath),
        this.steps,
        params?.apiKey || client.apiKey,
        params?.timeout,
      ) : sendAsyncFileRequestAndWait(
        new File(filePath),
        this.steps,
        params?.apiKey || client.apiKey,
        params?.timeout,
      );
    }

    async runBatch(
      texts: Iterable<TextContent | Input>,
      params?: {
            apiKey?: string,
            timeout?: number,
            onOutput?: (input: TextContent | Input, output: Output) => void,
            onError?: (input: TextContent | Input, error: any) => void,
          },
    ): Promise<Map<TextContent | Input, Output>> {
      return sendBatchRequest(
        texts,
        this.steps,
        params?.apiKey || client.apiKey,
        params?.timeout,
        params?.onOutput,
        params?.onError,
        client.printProgress,
      );
    }

    /** @deprecated since version 0.2.1, use property `runBatch` instead */
    async run_batch(
      texts: Iterable<TextContent | Input>,
      params?: {
          apiKey?: string,
          timeout?: number,
          onOutput?: (input: TextContent | Input, output: Output) => void,
          onError?: (input: TextContent | Input, error: any) => void,
        },
    ): Promise<Map<TextContent | Input, Output>> {
      return this.runBatch(texts, params);
    }
  };
}

export default pipeline;
