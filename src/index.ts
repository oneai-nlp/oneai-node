import {
  Skill, Input, Output, File, Document, Conversation,
} from './classes';
import { sendBatchRequest, sendRequest } from './requests';

class OneAI {
/**
 * A Language Skill is a package of trained NLP models.
 * Skills accept text and respond with processed texts and extracted metadata.
 *
 * Process texts with Skills using `Pipeline`s
 */
  readonly skills = {
    summarize: (
      params?: { min_length?: number, max_length?: number, find_origins?: boolean },
    ): Skill => {
      const skill: Skill = ({
        apiName: 'summarize',
        isGenerator: true,
        params,
        outputField: 'summary',
      });
      if (params?.find_origins !== false) {
        skill.params = { ...params };
        skill.labelType = 'origin';
        skill.outputField1 = 'origins';
      }
      return skill;
    },

    /** @deprecated since v. 0.0.9- use `names` or `numbers` instead */
    entities: (): Skill => ({
      apiName: 'entities',
      labelType: 'entity',
    }),

    emotions: (): Skill => ({
      apiName: 'emotions',
      labelType: 'emotion',
    }),

    /** @deprecated since v. 0.0.9- use `proofread` instead */
    enhanceTranscription: (): Skill => ({
      apiName: 'enhance',
      isGenerator: true,
      labelType: 'replacement',
      outputField: 'enhanced',
      outputField1: 'replacements',
    }),

    keywords: (): Skill => ({
      apiName: 'keywords',
      labelType: 'keyword',
    }),

    /** @deprecated since v. 0.0.9- use `splitBySentence` instead */
    sentences: (): Skill => ({
      apiName: 'sentences',
      labelType: 'sentence',
    }),

    highlights: (): Skill => ({
      apiName: 'highlights',
      labelType: 'highlight',
    }),

    topics: (): Skill => ({
      apiName: 'article-topics',
      labelType: 'topic',
      outputField: 'topics',
    }),

    sentiments: (): Skill => ({
      apiName: 'sentiments',
      labelType: 'sentiment',
    }),

    /** @deprecated since v. 0.0.9- use `htmlToArticle` instead */
    htmlExtractArticle: (): Skill => ({ apiName: 'extract-html' }),
    /** @deprecated since v. 0.0.9- use `htmlAllText` instead */
    htmlExtractText: (): Skill => ({ apiName: 'html-extract-text' }),

    htmlToArticle: (): Skill => ({ apiName: 'extract-html' }),
    htmlAllText: (): Skill => ({ apiName: 'html-extract-text' }),

    proofread: (): Skill => ({
      apiName: 'enhance',
      isGenerator: true,
      labelType: 'replacement',
      outputField: 'proofread',
      outputField1: 'replacements',
    }),

    actionItems: (): Skill => ({
      apiName: 'action-items',
      labelType: 'action-item',
      outputField: 'actionItems',
    }),

    anonymize: (): Skill => ({
      apiName: 'anonymize',
      isGenerator: true,
      labelType: 'anonymized',
      outputField: 'anonymizations',
    }),

    names: (): Skill => ({
      apiName: 'names',
      labelType: 'name',
    }),
    numbers: (): Skill => ({
      apiName: 'numbers',
      labelType: 'number',
    }),

    splitBySentence: (): Skill => ({
      apiName: 'sentences',
      labelType: 'sentence',
    }),
    splitByTopic: (): Skill => ({
      apiName: 'dialogue-segmentation',
      labelType: 'dialogue-segment',
      outputField: 'segments',
    }),

    salesInsights: (): Skill => ({
      apiName: 'sales-insights',
      labelType: 'sales-insights',
      outputField: 'salesInsights',
    }),
  };

  File = File;

  Conversation = Conversation;

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
        text: Input | string,
        params?: {
          apiKey?: string,
          timeout?: number
        },
      ): Promise<Output> {
        return sendRequest(text, this.steps, params?.apiKey || client.apiKey, params?.timeout);
      }

      async run_batch(
        texts: Iterable<Input | string>,
        params?: { apiKey?: string, timeout?: number },
      ): Promise<Map<Input | string, Output>> {
        return sendBatchRequest(
          texts,
          this.steps,
          params?.apiKey || client.apiKey,
          params?.timeout,
          client.printProgress,
        );
      }
    };
  }

  private static instance = new OneAI();

  /** @deprecated since version 0.1.3. Create a `OneAI` instance instead */
  static get skills() {
    return OneAI.instance.skills;
  }

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
