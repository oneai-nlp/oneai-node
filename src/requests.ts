import axios from 'axios'
import { Skill, Input, Output, Label } from './classes'
import { stdout, stderr } from 'process'


const MAX_CONCURRENT_REQUESTS = 4

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

function time_format(time: number) {
    let millies = Math.floor(time % 1000)
    let seconds = Math.floor(time / 1000)
    let minutes = Math.floor(seconds / 60)
    return `${(minutes > 0) ? minutes + 'm ' : ''}${seconds % 60}s ${millies}ms`
}

export async function send_batch_request(
    inputs: Iterable<string | Input>,
    skills: Skill[],
    api_key: string,
    print_progress=true
): Promise<Map<string | Input, Output>> {
    let outputs = new Map<string | Input, Output>() 
    
    let generator = function*() {
        yield* inputs
    }()

    let errors = 0
    let time_total = 0
    async function batch_worker() {
        let { value, done } = generator.next()
        let time_start = Date.now()
        while (!done) {
            try {
                outputs.set(value!, await send_request(value!, skills, api_key))
            } catch (e) {
                errors++
                if (print_progress) stderr.write(`\r\033[KInput ${outputs.size + errors}:`)
                console.error(e)
            } finally {
                let time_delta = Date.now() - time_start
                time_total += time_delta
                time_start += time_delta
                if (print_progress) stdout.write(`Input ${outputs.size + errors} - ${time_format(time_delta)}/input - ${time_format(time_total)} total - ${outputs.size} successful - ${errors} failed\r`)
            }
            ({ value, done } = generator.next())
        }
    }

    if (print_progress) stdout.write(`Starting processing batch with ${MAX_CONCURRENT_REQUESTS} workers\r`)
    let workers = [...Array(MAX_CONCURRENT_REQUESTS).keys()].map(_ => batch_worker())
    return Promise.all(workers).then(() => {
        if (print_progress) stdout.write(`Processed ${outputs.size + errors} - ${time_format(time_total / outputs.size + errors)}/input - ${time_format(time_total)} total - ${outputs.size} successful - ${errors} failed\n`)
        return outputs
    })
}