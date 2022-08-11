import type { Skill, Output, Label } from './classes';

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

  transcribe: (): Skill => ({
    apiName: 'transcribe',
    isGenerator: true,
    outputField: 'transcription',
  }),

  detectLanguage: (): Skill => ({
    apiName: 'detect-language',
    labelType: 'detect-language',
    outputField: 'language',
  }),
};

export interface OutputFields {
    summary?: Output
    origins?: Label[]
    emotions?: Label[]
    proofread?: Output
    replacements?: Label[]
    keywords?: Label[]
    sentences?: Label[]
    highlights?: Label[]
    topics?: Label[]
    sentiments?: Label[]
    actionItems?: Label[]
    anonymized?: Output
    anonymizations?: Label[]
    names?: Label[]
    numbers?: Label[]
    segments?: Label[]
    salesInsights?: Label[]
    transcription?: Output
}
