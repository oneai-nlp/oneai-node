export interface Skill {
    name: string
    is_generator?: boolean
    params?: object
}

export interface Input {
    type: string
    get_text(): string
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
