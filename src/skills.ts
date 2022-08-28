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

  emotions: (): Skill => ({
    apiName: 'emotions',
    labelType: 'emotion',
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

  htmlToArticle: (): Skill => ({ 
    apiName: 'extract-html',
    isGenerator: true,
    labelType: 'extract-html',
    outputField: 'htmlArticle',
    outputField1: 'htmlFields',
  }),
  htmlAllText: (): Skill => ({
    apiName: 'html-extract-text',
    isGenerator: true,
    labelType: 'html-extract-text',
    outputField: 'htmlText',
    outputField1: 'htmlFields',
  }),

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

  pricing: (): Skill => ({
    apiName: 'business-entities',
    labelType: 'business-entity',
    outputField: 'pricing',
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
    language?: Label[]
    pricing?: Label[]
}
