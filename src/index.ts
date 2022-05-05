import { Skill, Input, Output } from './classes'
import { send_batch_request, send_request } from './requests'

/**
 * A Language Skill is a package of trained NLP models. Skills accept text and respond with processed texts and extracted metadata.
 * 
 * Process texts with Skills using `Pipeline`s
 */
export const skills = {
    summarize: (params?: { min_length?: number, max_length?: number, find_origins?: boolean }): Skill => {
        let skill: Skill = ({
            api_name: 'summarize',
            is_generator: true,
            params: params,
            output_field: 'summary'
        })
        if (params?.find_origins !== false) {
            skill.params = {...params, find_origins: true}
            skill.label_type = 'origin'
            skill.output_field1 = 'origins'
        }
        return skill
    },

    entities: (): Skill => ({ 
        api_name: 'entities',
        label_type: 'entity'
    }),

    emotions: (): Skill => ({
        api_name: 'emotions',
        label_type: 'emotion'
    }),

    enhanceTranscription: (): Skill => ({ 
        api_name: 'enhance',
        is_generator: true,
        label_type: 'replacement',
        output_field: 'enhanced',
        output_field1: 'replacements'
    }),

    keywords: (): Skill => ({
        api_name: 'keywords',
        label_type: 'keyword'
    }),

    sentences: (): Skill => ({
        api_name: 'sentences',
        label_type: 'sentence'
    }),
    
    highlights: (): Skill => ({
        api_name: 'highlights',
        label_type: 'highlight'
    }),

    topics: (): Skill => ({
        api_name: 'article-topics',
        label_type: 'topic',
        output_field: 'topics'
    }),

    sentiments: (): Skill => ({
        api_name: 'sentiments',
        label_type: 'sentiment'
    }),

    htmlExtractArticle: (): Skill => ({ api_name: 'extract-html' }),
    htmlExtractText: (): Skill => ({ api_name: 'html-extract-text' }),
}

/** the default API key to use, get one at https://studio.oneai.com/settings/api-keys */
export var api_key: string
/** whether to log progress when processing batches */
export var PRINT_PROGRESS = true

export class Pipeline {
    steps: Skill[]

    constructor(...steps: Skill[]) {
        this.steps = steps
    }

    async run(text: Input | string, key: string | undefined=undefined): Promise<Output> {
        return send_request(text, this.steps, key || api_key)
    }

    async run_batch(texts: Iterable<Input | string>, key: string | undefined=undefined): Promise<Map<Input | string, Output>> {
        return send_batch_request(texts, this.steps, key || api_key, PRINT_PROGRESS)
    }
}

export { Skill, Output, Input, Document, Conversation } from './classes'
