import axios from 'axios'
import { Skill, Input, Output, Label } from './classes'

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

function prep_output(
    skills: Skill[],
    output: any,
    output_index=0,
    skill_index=0
): Output {
    if (skill_index === 0 && skills[0].is_generator) {
        let result: Output = { text: output['input_text'] }
        result[skills[0].output_field || skills[0].name] = prep_output(skills, output, output_index, skill_index + 1)
        return result
    } else {
        let result: Output = { text: output['output'][output_index]['text'] }
        let labels: Label[] = output['output'][output_index]['labels']
        
        for (let i = skill_index; i < skills.length; i++) {
            let field = skills[i].output_field || skills[i].name
            result[field] = (skills[i].is_generator) 
                ? prep_output(skills, output, output_index + 1, i + 1) 
                : labels.filter(label => label.type === skills[i].label_type)
        }

        return result
    }
}

export async function send_request(input: string | Input, skills: Skill[], api_key: string): Promise<Output> {
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
    }).then(response => prep_output(skills, response.data))
}

export async function send_batch_request(params: Iterable<string | Input>) {
    // todo
}