/* istanbul ignore file */
import axios from 'axios';
import {
  AsyncApiResponse,
  AsyncApiTask,
  Conversation, Input, isFile, Label, Output, Skill, _Input, isCSV,
} from '../model/pipeline';
import { ClusteringApiParams } from '../clustering';
import { httpStatusErrorType } from '../errors';
import { MultilingualParams } from './client';

export function buildRequest(
  input: Input,
  skills: Skill[],
  includeText: boolean,
  multilingual: boolean | MultilingualParams,
): string {
  const fixedInput = (isFile(input.text) && includeText)
    ? {
      ...input,
      text: input.text.buffer!.toString(input.encoding),
    } : input;
  return JSON.stringify({
    ...(includeText && { input: fixedInput.text, encoding: fixedInput.encoding }),
    ...(isCSV(fixedInput.text) && {
      csv_params: {
        columns: fixedInput.text.columns,
        skip_rows: fixedInput.text.skipRows,
        max_rows: fixedInput.text.maxRows,
      },
    }),
    input_type: fixedInput.type,
    output_type: 'json',
    content_type: fixedInput.contentType,
    multilingual,
    steps: skills.map((skill) => ({
      skill: skill.apiName,
      params: {
        ...(skill.params !== undefined && skill.params),
        ...(skill.apiName === 'clustering' && input.metadata !== undefined && { user_metadata: input.metadata }),
      },
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

function buildOutputBase(contents: any, stats?: any, headers?: any): Output {
  return {
    text: (contents.length > 1 || 'speaker' in contents[0])
      ? contents.map((utterance: any) => ({
        ...utterance,
        ...utterance.timestamp && { timestamp: timestampToMilliseconds(utterance.timestamp) },
      })) as Conversation
      : contents[0].utterance as string,
    requestId: headers?.['x-oneai-request-id'],
    stats: (headers !== undefined) ? {
      concurrencyWaitTime: stats?.concurrency_wait_time,
      totalRunningJobs: stats?.total_running_jobs,
      totalWaitingJobs: stats?.total_waiting_jobs,
      wordCount: parseInt(headers?.['x-oneai-word-count'], 10),
      transcriptionSecondsCount: parseInt(headers?.['x-oneai-transcribe-seconds-count'], 10),
    } : undefined,
  };
}

export function buildOutput(
  steps: Skill[],
  output: any,
  headers: any,
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
    includeStats: boolean,
  ): Output {
    const source = output.output[outputIndex];
    const result: Output = (includeStats)
      ? buildOutputBase(source.contents, output.stats, headers)
      : buildOutputBase(source.contents);
    const labels: Label[] = source.labels.map(buildLabel);

    skills.some((skill, i) => {
      if (skill.textField) {
        const [, nextSkills] = splitPipeline(skills, i);
        result[skill.textField] = build(outputIndex + 1, nextSkills, false);
        return true;
      }
      result[skill.labelsField || skill.apiName] = labels.filter(
        (label: Label) => label.skill === skill.apiName,
      );
      return false;
    });

    return result;
  }

  // handle output lists
  if ('outputs' in output) {
    const result = buildOutputBase([{ utterance: '' }], output.stats, headers);
    result.outputs = output.outputs.map((o: any) => buildOutput(steps, o, {}));
    return result;
  }

  const generator = (output.output[0].text_generated_by_step_id || 0) - 1;
  if (generator < 0) return build(0, steps, true);

  // edge case- first Skill is a generator, or a generator preceded by
  // Skills that didn't generate output. In this case the API will skip these Skills,
  // so we need to create filler objects to match the expected structure
  const [currentSkills, nextSkills] = splitPipeline(steps, generator);
  const result: Output = buildOutputBase(output.input, output.stats, headers);

  currentSkills.forEach((skill) => {
    if (skill.textField) {
      result[skill.textField] = build(0, nextSkills, false);
    } else {
      result[skill.labelsField || skill.apiName] = [];
    }
  });
  return result;
}

export function buildError(error: any): any {
  console.log(error.response.data);
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

export function buildAsyncApiResponse(
  task: AsyncApiTask,
  response: any,
  headers: any,
): AsyncApiResponse {
  let result;
  if (response.status === 'COMPLETED') {
    result = buildOutput(task.skills, response.result, headers);
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
