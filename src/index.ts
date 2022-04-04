import { Skill, LabeledText } from './classes'
import { send_request } from "./requests"

export const skills = {
    summarize: (params?: { min_length?: number, max_length?: number }): Skill => ({
        name: 'summarize',
        is_generator: true,
        params: params
    }),
    entities: (): Skill => ({ name: 'entities' }),
    emotions: (): Skill => ({ name: 'emotions' }),
    enhanceTranscription: (): Skill => ({ 
        name: 'enhance',
        is_generator: true
    }),
    keywords: (): Skill => ({ name: 'keywords' }),
    sentences: (): Skill => ({ name: 'sentences' }),
    highlights: (): Skill => ({ name: 'highlights' })
}

export var api_key: string

export class Pipeline {
    steps: Skill[]

    constructor(...steps: Skill[]) {
        this.steps = steps
    }

    async run(text: string): Promise<LabeledText[]> {
        return send_request(text, this.steps, api_key)
    }

    async run_batch(texts: string[]): Promise<LabeledText[][]> {
        // todo: workers
        return Promise.all(texts.map(text => this.run(text)))
    }
}

export { Skill, LabeledText, Input, Document, Conversation } from './classes'
