import {
  Skill, Input, Output, File, Document, Conversation, TextContent,
} from './classes';
import { sendBatchRequest, sendRequest } from './requests';
import { skills } from './skills';

class OneAI {
/**
 * A Language Skill is a package of trained NLP models.
 * Skills accept text and respond with processed texts and extracted metadata.
 *
 * Process texts with Skills using `Pipeline`s
 */
  readonly skills = skills;

  static skills = skills;

  File = File;

  /** @deprecated since version 0.2.0, use `TextContent` object literal instead */
  Conversation = Conversation;

  /** @deprecated since version 0.2.0, use `TextContent` object literal instead */
  Document = Document;

  /** the default API key to use, get one at https://studio.oneai.com/settings/api-keys */
  apiKey?: string;

  /** @deprecated since version 0.0.8. Use `apiKey` instead */
  get api_key() { return this.apiKey; }

  /** @deprecated since version 0.0.8. Use `apiKey` instead */
  set api_key(value) { this.apiKey = value; }

  /** default request timeout */
  timeout?: number;

  /** whether to log progress when processing batches */
  printProgress: boolean;

  constructor(
    apiKey?: string,
    params?: {
      timeout?: number,
      printProgress?: boolean,
    },
  ) {
    this.apiKey = apiKey;
    this.timeout = params?.timeout;
    this.printProgress = params?.printProgress || true;
  }

  get Pipeline() {
    const client = this;
    return class {
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

      async run_batch(
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

  private static instance = new OneAI();

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static get apiKey() {
    return OneAI.instance.apiKey;
  }

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static set apiKey(apiKey: string | undefined) {
    OneAI.instance.apiKey = apiKey;
  }

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static get PRINT_PROGRESS() {
    return OneAI.instance.printProgress;
  }

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static set PRINT_PROGRESS(printProgress: boolean) {
    OneAI.instance.printProgress = printProgress;
  }

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static get Pipeline() {
    return OneAI.instance.Pipeline;
  }

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static get File() {
    return OneAI.instance.File;
  }

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static get Document() {
    return OneAI.instance.Document;
  }

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static get Conversation() {
    return OneAI.instance.Conversation;
  }
}
export = OneAI;
