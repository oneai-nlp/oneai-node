import { parseConversation } from './parsing'

export interface Skill {
    name: string
    is_generator?: boolean
    params?: object
}

export interface Input {
    type: string
    get_text(): string
}

export class Document implements Input {
    type: string = 'article'
    text: string

    constructor(text: string) {
        this.text = text
    }

    get_text(): string {
        return this.text
    }
}

export interface Utterance {
    speaker: string,
    utterance: string
}

export class Conversation implements Input {
    type: string = 'conversation'
    utterances: Utterance[]

    constructor(utterances: Utterance[]) {
        this.utterances = utterances
    }

    get_text(): string {
        return JSON.stringify(this.utterances)
    }

    static parse(text: string): Conversation {
        return new Conversation(parseConversation(text))
    }
}

export interface Label {
    type: string
    name: string
    span: number[]
    value: number
}

export interface LabeledText {
    text: string
    labels: Label[]
}
