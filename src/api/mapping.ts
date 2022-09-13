import axios from 'axios';
import {
  AsyncApiResponse,
  AsyncApiTask,
  ConversationContent, Input, isFileContent, Label, Output, Skill, _Input,
} from '../classes';
import { ClusteringApiParams } from '../clustering';
import { httpStatusErrorType } from '../errors';

export function buildRequest(input: Input, skills: Skill[], includeText: boolean): string {
  const fixedInput = (isFileContent(input.text) && includeText)
    ? {
      text: input.text.buffer.toString(input.encoding),
      encoding: input.encoding,
      contentType: input.contentType,
      type: input.type,
    } : input;
  return JSON.stringify({
    ...(includeText && { input: fixedInput.text }),
    input_type: fixedInput.type,
    output_type: 'json',
    encoding: fixedInput.encoding,
    content_type: fixedInput.contentType,
    steps: skills.map((skill) => ({
      skill: skill.apiName,
      params: skill.params,
    })),
  }, (_, value) => value ?? undefined);
}

const pattern = /(\d+):(\d+):(\d+).(\d+)/;
function timestampToMilliseconds(timestamp?: string): number | undefined {
  if (!timestamp) return undefined;
  const match = timestamp.match(pattern);
  if (!match) return undefined;
  const numbers = match.map((n) => parseInt(n, 10));
  const [, hour, minute, second, milli] = numbers;
  return (((hour * 60 + minute) * 60 + second)) * 1000 + milli;
}

const buildLabel = (label: any) => ({
  ...label.skill && { skill: label.skill },
  ...label.type && { type: label.type },
  ...label.name && { name: label.name },
  ...label.span && { span: label.span },
  ...label.span_text && { spanText: label.span_text, span_text: label.span_text },
  ...label.output_spans && { outputSpans: label.output_spans },
  ...label.input_spans && { inputSpans: label.input_spans },
  ...label.value && { value: label.value },
  ...label.timestamp && { timestamp: timestampToMilliseconds(label.timestamp) },
  ...label.timestamp_end && { timestampEnd: timestampToMilliseconds(label.timestamp_end) },
  data: label.data || {},
} as Label);

export function buildOutput(
  steps: Skill[],
  output: any,
): Output {
  function splitPipeline(skills: Skill[], i: number): Skill[][] {
    // split pipeline at a generator Skill
    const first = skills.slice(0, i + 1);
    const second = skills.slice(i + 1);
    if (skills[i].labelsField) {
      // handle skills that create both text and labels
      const clone = { ...skills[i] };
      clone.textField = undefined;
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
      text: (source.contents.length > 1 || 'speaker' in source.contents[0])
        ? (source.contents as ConversationContent)
        : source.contents[0].utterance as string,
    };
    const labels: Label[] = source.labels.map(buildLabel);

    skills.some((skill, i) => {
      if (skill.textField) {
        const [, nextSkills] = splitPipeline(skills, i);
        result[skill.textField] = build(outputIndex + 1, nextSkills);
        return true;
      }
      result[skill.labelsField || skill.apiName] = labels.filter(
        (label: Label) => label.skill === skill.apiName,
      );
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
    if (skill.textField) {
      result[skill.textField] = build(0, nextSkills);
    } else {
      result[skill.labelsField || skill.apiName] = [];
    }
  });
  return result;
}

export function buildError(error: any): any {
  if (axios.isAxiosError(error) && error.response !== undefined) {
    return new httpStatusErrorType[error.response.status.toString()](
      error.response.data?.status_code || error.response.status,
      error.response.data?.message || error.message,
      error.response.data?.details,
      error.response.data?.request_id,
    );
  }
  if (typeof error === 'object' && 'status_code' in error) {
    return new httpStatusErrorType[error.status_code.toString().substring(0, 3)](
      error.status_code,
      error.message,
      error.details,
      error.request_id,
    );
  }

  return error;
}

export function buildAsyncApiResponse(task: AsyncApiTask, response: any) : AsyncApiResponse {
  let result;
  if (response.status === 'COMPLETED') {
    result = buildOutput(task.skills, response.result);
  } else if (response.status === 'FAILED') {
    result = buildError(response.result);
  }
  return {
    ...task,
    status: response.status,
    result,
  };
}

export function buildClusteringItems(
  inputs: _Input<string>[],
  forceNewClusters?: boolean,
  forceClusterId?: number,
) {
  return inputs.map((input) => ({
    text: input.text,
    item_metadata: input.metadata,
    ...forceNewClusters && { 'force-new-cluster': forceNewClusters },
    ...forceClusterId && { 'force-cluster-id': forceClusterId },
  }));
}

export function buildClusteringQueryParams(params?: ClusteringApiParams): string {
  const urlParams = new URLSearchParams();
  const fromDate = (typeof params?.fromDate === 'string') ? new Date(params?.fromDate) : params?.fromDate;
  const toDate = (typeof params?.toDate === 'string') ? new Date(params?.toDate) : params?.toDate;

  urlParams.set('include-items', 'false');
  urlParams.set('include-phrases', 'false');
  if (params?.sort !== undefined) urlParams.set('sort', params.sort);
  if (params?.limit !== undefined) urlParams.set('limit', params.limit.toString());
  if (fromDate !== undefined) urlParams.set('from-date', fromDate.toISOString());
  if (toDate !== undefined) urlParams.set('to-date', toDate.toISOString());
  if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params.itemMetadata);

  return urlParams.toString();
}
