import {
  ConversationContent, Label, Output, Skill,
} from '../classes';

const pattern = /(\d+):(\d+):(\d+).(\d+)/;
export function timestampToMilliseconds(timestamp?: string): number | undefined {
  if (!timestamp) return undefined;
  const match = timestamp.match(pattern);
  if (!match) return undefined;
  const numbers = match.map((n) => parseInt(n, 10));
  const [, hour, minute, second, milli] = numbers;
  return (((hour * 60 + minute) * 60 + second)) * 1000 + milli;
}

export function buildOutput(
  steps: Skill[],
  output: any,
): Output {
  function splitPipeline(skills: Skill[], i: number): Skill[][] {
    // split pipeline at a generator Skill
    const first = skills.slice(0, i + 1);
    const second = skills.slice(i + 1);
    if (skills[i].outputField1) {
      // handle skills that create both text and labels
      const clone = { ...skills[i] };
      clone.isGenerator = false;
      clone.outputField = clone.outputField1;
      second.unshift(clone);
    }
    return [first, second];
  }

  function build(
    outputIndex: number,
    skills: Skill[],
  ): Output {
    const source = output.output[outputIndex];
    const result: Output = {
      text: 'text' in source ? source.text : (source.contents as ConversationContent),
    };
    const labels: Label[] = source.labels.map((label: any) => ({
      ...label.type && { type: label.type },
      ...label.name && { name: label.name },
      ...label.span && { span: label.span },
      ...label.span_text && { span_text: label.span_text },
      ...label.output_spans && { outputSpans: label.output_spans },
      ...label.input_spans && { inputSpans: label.input_spans },
      ...label.value && { value: label.value },
      ...label.timestamp && { timestamp: timestampToMilliseconds(label.timestamp) },
      ...label.timestamp_end && { timestampEnd: timestampToMilliseconds(label.timestamp_end) },
      data: label.data || {},
    }));

    skills.some((skill, i) => {
      const field = skill.outputField || skill.apiName;
      if (skill.isGenerator) {
        const [, nextSkills] = splitPipeline(skills, i);
        result[field] = build(outputIndex + 1, nextSkills);
        return true;
      }
      result[field] = labels.filter((label: Label) => label.type === skill.labelType);
      return false;
    });

    return result;
  }

  const generator = (output.output[0].text_generated_by_step_id || 0) - 1;
  if (generator < 0) return build(0, steps);

  // edge case- first Skill is a generator, or a generator preceded by
  // Skills that didn't generate output. In this case the API will skip these Skills,
  // so we need to create filler objects to match the expected structure
  const [currentSkills, nextSkills] = splitPipeline(steps, generator);
  const result: Output = { text: output.input_text };

  currentSkills.forEach((skill) => {
    const field = skill.outputField || skill.apiName;
    result[field] = (skill.isGenerator) ? build(0, nextSkills) : [];
  });
  return result;
}
