import { Skill, Input, Output } from './classes';
import { sendBatchRequest, sendRequest } from './requests';

/**
 * A Language Skill is a package of trained NLP models.
 * Skills accept text and respond with processed texts and extracted metadata.
 *
 * Process texts with Skills using `Pipeline`s
 */
export const skills = {
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

/* eslint-disable import/no-mutable-exports */
/** the default API key to use, get one at https://studio.oneai.com/settings/api-keys */
export let apiKey: string;
/** @deprecated since version 0.0.8. Use `apiKey` instead */
export let api_key: string='';
/** whether to log progress when processing batches */
export const PRINT_PROGRESS = true;

export class Pipeline {
  steps: Skill[];

  constructor(...steps: Skill[]) {
    this.steps = steps;
  }

  async run(text: Input | string, params?: { apiKey?: string, timeout?: number }): Promise<Output> {
    return sendRequest(text, this.steps, params?.apiKey || apiKey || api_key, params?.timeout);
  }

  async run_batch(
    texts: Iterable<Input | string>,
    params?: { apiKey?: string, timeout?: number },
  ): Promise<Map<Input | string, Output>> {
    return sendBatchRequest(texts, this.steps, params?.apiKey || apiKey || api_key, params?.timeout, PRINT_PROGRESS);
  }
}

export {
  Skill, Output, Input, Document, Conversation, File,
} from './classes';
