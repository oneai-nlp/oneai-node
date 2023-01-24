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

  emotions: (params?: {}): Skill => ({ apiName: 'emotions', params }),

  keywords: (params?: {}): Skill => ({ apiName: 'keywords', params }),

  /** @deprecated since v. 0.0.9- use `splitBySentence` instead */
  sentences: (params?: {}): Skill => ({ apiName: 'sentences', params }),

  highlights: (params?: {}): Skill => ({ apiName: 'highlights', params }),

  topics: (params?: {}): Skill => ({
    apiName: 'article-topics', labelsField: 'topics', params,
  }),

  sentiments: (params?: {}): Skill => ({ apiName: 'sentiments', params }),

  htmlToArticle: (params?: {}): Skill => ({
    apiName: 'html-extract-article',
    textField: 'htmlArticle',
    labelsField: 'htmlFields',
    params,
  }),
  htmlAllText: (params?: {}): Skill => ({
    apiName: 'html-extract-text',
    textField: 'htmlText',
    labelsField: 'htmlFields',
    params,
  }),

  proofread: (params?: {}): Skill => ({
    apiName: 'enhance',
    textField: 'proofread',
    labelsField: 'replacements',
    params,
  }),

  actionItems: (params?: {}): Skill => ({
    apiName: 'action-items', labelsField: 'actionItems', params,
  }),

  anonymize: (params?: {}): Skill => ({
    apiName: 'anonymize',
    labelsField: 'anonymizations',
    params,
  }),

  names: (params?: {}): Skill => ({ apiName: 'names', params }),
  numbers: (params?: {}): Skill => ({ apiName: 'numbers', params }),

  splitBySentence: (params?: {}): Skill => ({ apiName: 'sentences', params }),
  splitByTopic: (params?: {}): Skill => ({
    apiName: 'dialogue-segmentation', labelsField: 'segments', params,
  }),

  salesInsights: (params?: {}): Skill => ({
    apiName: 'sales-insights', labelsField: 'salesInsights', params,
  }),

  transcribe: (params?: { timestamp_per_word?: boolean, engine?: 'defualt' | 'whisper' }): Skill => ({
    apiName: 'transcribe',
    textField: 'transcription',
    labelsField: 'words',
    params,
  }),

  detectLanguage: (params?: {}): Skill => ({
    apiName: 'detect-language', labelsField: 'language', params,
  }),

  headline: (params?: {}): Skill => ({
    apiName: 'headline', labelsField: 'headline', params,
  }),

  subheading: (params?: {}): Skill => ({
    apiName: 'subheading', labelsField: 'subheading', params,
  }),

  pricing: (params?: {}): Skill => ({
    apiName: 'business-entities', labelsField: 'pricing', params,
  }),

  emailInsights: (params?: {}): Skill => ({
    apiName: 'service-email-insights', labelsField: 'emailInsights', params,
  }),

  clustering: (params?: {
    collection?: string,
    user_metadata?: Record<string, any>,
    input_skill?: string,
  }): Skill => ({
    apiName: 'clustering', labelsField: 'clusters', params,
  }),
};

export interface OutputFields {
    summary?: Output
    htmlArticle?: Output
    htmlFields?: Label[]
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
    subheading?: Label[]
    pricing?: Label[]
    emailInsights?: Label[]
}
