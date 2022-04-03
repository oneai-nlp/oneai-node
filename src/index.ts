import axios from 'axios'



interface Skill {
    readonly name: string
    readonly iswriting?: boolean
    readonly params?: object
}

export const init= (key: string) => ({
    Skill: Skill,

    export interface Label {
        readonly type: string
        readonly name: string
        readonly span: number[]
        readonly value: number
    }

    export interface LabeledText {
        readonly text: string
        readonly labels: Label[]
    }

    export const skills = {
        summarize: (params?: { min_length?: number, max_length?: number }): Skill => ({
            name: 'summarize',
            iswriting: true,
            params: params
        }),
        entities: (): Skill => ({ name: 'entities' }),
        emotions: (): Skill => ({ name: 'emotions' }),
        enhanceTranscription: (): Skill => ({ 
            name: 'enhance',
            iswriting: true
        }),
        keywords: (): Skill => ({ name: 'keywords' }),
        sentences: (): Skill => ({ name: 'sentences' }),
        highlights: (): Skill => ({ name: 'highlights' })
    }

    function prep_input(skills: Skill[]): object[] {
        let input = 0
        return skills.map((skill, id) => {
            let prepped = {
                'skill': skill.name,
                'id': id,
                'input': input,
                'params': skill.params
            }
            if (skill.iswriting) input++
            return prepped
        })
    }

    function prep_output(output: any[]): LabeledText[] {
        const prep_label = (label: any): Label => ({
            type: label['type'],
            name: label['name'],
            span: label['span'],
            value: label['value']
        })
        
        return output.map(t => ({
            text: t['text'],
            labels: t['labels'].map(prep_label)
        }))
    }

    export async function process(text: string, skills: Skill[]): Promise<LabeledText[]> {
        return await axios({
            method: 'POST',
            url: 'https://api.oneai.com/api/v0/pipeline',
            headers: {
                'api-key': key,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                text: text,
                input_type: 'auto-detect',
                steps: prep_input(skills)
            })
        }).then(response => prep_output(response.data.output))
    }
})