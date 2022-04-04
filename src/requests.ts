import axios from 'axios'
import { Skill, Input, LabeledText, Label } from './classes'

function prep_input(skills: Skill[]): object[] {
    let input = 0
    return skills.map((skill, id) => {
        let prepped = {
            'skill': skill.name,
            'id': id,
            'input': input,
            'params': skill.params
        }
        if (skill.is_generator) input++
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

export async function send_request(input: string | Input, skills: Skill[], api_key: string): Promise<LabeledText[]> {
    return await axios({
        method: 'POST',
        url: 'https://api.oneai.com/api/v0/pipeline',
        headers: {
            'api-key': api_key,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            text: (typeof(input) === 'string') ? input : input.get_text(),
            input_type: (typeof(input) === 'string') ? 'article' : input.type,
            steps: prep_input(skills)
        })
    }).then(response => prep_output(response.data.output))
}

export async function send_batch_request(params: Iterable<string | Input>) {
    // todo
}