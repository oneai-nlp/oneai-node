import type OneAI from '.';
import {
  Input, Output, Skill, TextContent,
} from './classes';
import { sendBatchRequest, sendRequest } from './requests';

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
  };
}

export default pipeline;
