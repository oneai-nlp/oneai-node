import type { Skill, Output, Label } from './classes';

export const skills = {
  summarize: (
    params?: { min_length?: number, max_length?: number, find_origins?: boolean },
  ): Skill => {
    const skill: Skill = ({
      apiName: 'summarize',
      params,
      textField: 'summary',
    });
    if (params?.find_origins !== false) {
      skill.params = { ...params };
      skill.labelsField = 'origins';
    }
    return skill;
  },

  emotions: (): Skill => ({ apiName: 'emotions' }),

  keywords: (): Skill => ({ apiName: 'keywords' }),

  /** @deprecated since v. 0.0.9- use `splitBySentence` instead */
  sentences: (): Skill => ({ apiName: 'sentences' }),

  highlights: (): Skill => ({ apiName: 'highlights' }),

  topics: (): Skill => ({
    apiName: 'article-topics', textField: 'topics',
  }),

  sentiments: (): Skill => ({ apiName: 'sentiments' }),

  htmlToArticle: (): Skill => ({
    apiName: 'extract-html',
    textField: 'htmlArticle',
    labelsField: 'htmlFields',
  }),
  htmlAllText: (): Skill => ({
    apiName: 'html-extract-text',
    textField: 'htmlText',
    labelsField: 'htmlFields',
  }),

  proofread: (): Skill => ({
    apiName: 'enhance',
    textField: 'proofread',
    labelsField: 'replacements',
  }),

  actionItems: (): Skill => ({
    apiName: 'action-items', textField: 'actionItems',
  }),

  anonymize: (): Skill => ({
    apiName: 'anonymize',
    textField: 'anonymizations',
  }),

  names: (): Skill => ({ apiName: 'names' }),
  numbers: (): Skill => ({ apiName: 'numbers' }),

  splitBySentence: (): Skill => ({ apiName: 'sentences' }),
  splitByTopic: (): Skill => ({
    apiName: 'dialogue-segmentation', textField: 'segments',
  }),

  salesInsights: (): Skill => ({
    apiName: 'sales-insights', textField: 'salesInsights',
  }),

  transcribe: (params?: { timestamp_per_word?: boolean }): Skill => ({
    apiName: 'transcribe',
    textField: 'transcription',
    labelsField: 'words',
    params,
  }),

  detectLanguage: (): Skill => ({
    apiName: 'detect-language', textField: 'language',
  }),

  headline: (): Skill => ({
    apiName: 'headline', textField: 'headline',
  }),

  pricing: (): Skill => ({
    apiName: 'business-entities', textField: 'pricing',
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
    words?: Label[]
    language?: Label[]
    headline?: Label[]
    pricing?: Label[]
}
