import { Skill, Input, Output } from './classes'
import { send_batch_request, send_request } from './requests'

export const skills = {
    summarize: (params?: { min_length?: number, max_length?: number }): Skill => ({
        name: 'summarize',
        is_generator: true,
        params: params,
        output_field: 'summary'
    }),

    entities: (): Skill => ({ 
        name: 'entities',
        label_type: 'entity'
    }),

    emotions: (): Skill => ({
        name: 'emotions',
        label_type: 'emotion'
    }),

    enhanceTranscription: (): Skill => ({ 
        name: 'enhance',
        is_generator: true,
        output_field: 'enhancedTranscription'
    }),

    keywords: (): Skill => ({
        name: 'keywords',
        label_type: 'keyword'
    }),

    sentences: (): Skill => ({
        name: 'sentences',
        label_type: 'sentence'
    }),
    
    highlights: (): Skill => ({
        name: 'highlights',
        label_type: 'highlight'
    }),

    topics: (): Skill => ({
        name: 'topics',
        label_type: 'topic'
    }),

    sentiments: (): Skill => ({
        name: 'sentiments',
        label_type: 'sentiment'
    }),

    htmlExtractArticle: (): Skill => ({ name: 'extract-html' }),
    htmlExtractText: (): Skill => ({ name: 'html-extract-text' }),
}

export var api_key: string
export var PRINT_PROGRESS = true

export class Pipeline {
    steps: Skill[]

    constructor(...steps: Skill[]) {
        this.steps = steps
    }

    async run(text: Input | string): Promise<Output> {
        return send_request(text, this.steps, api_key)
    }

    async run_batch(texts: Iterable<Input | string>): Promise<Map<Input | string, Output>> {
        return send_batch_request(texts, this.steps, api_key, PRINT_PROGRESS)
    }
}

export { Skill, Output, Input, Document, Conversation } from './classes'
