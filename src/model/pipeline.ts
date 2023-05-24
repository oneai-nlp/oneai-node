import fs from 'fs';
import * as path from 'path';
import type { OutputFields } from '../skills';
import { OneAIError } from '../errors';

export interface Skill {
  apiName: string
  params?: object
  textField?: string
  labelsField?: string
}

export type File = {
  filePath: string,
  buffer?: Buffer,
};
export type Conversation = {
  speaker: string,
  utterance: string,
  timestamp?: number,
}[];

export type CSVColumn =
  /** The text input to be processed  */
  'input' |
  /** Input timestamp */
  'timestamp' |
  /** Input translation */
  'input_translated' |
  /** Custom Metadata */
  string |
  /** Skip column */
  false;

export interface CSV extends File {
  columns: CSVColumn[],
  skipRows?: number,
  maxRows?: number,
}

export type TextContent = string | Conversation | File;

export type inputType = 'article' | 'conversation';
export type encoding = 'utf8' | 'base64';

export interface _Input<T extends TextContent> {
  text: T;
  type?: inputType;
  contentType?: string;
  encoding?: encoding;
  metadata?: Record<string, any>;
}

export type Input = _Input<TextContent>;

export function isInput(object: any): object is Input {
  return typeof object === 'object' && 'text' in object;
}

export function isFile(object: any): object is File {
  return typeof object === 'object' && 'filePath' in object;
}

export function isCSV(object: any): object is CSV {
  return typeof object === 'object' && 'columns' in object;
}

interface ExtInfo {
  contentType: string,
  type: inputType,
  isBinary: boolean,
}

const extensions: Record<string, ExtInfo> = {
  '.json': {
    contentType: 'application/json',
    type: 'conversation',
    isBinary: false,
  },
  '.txt': {
    contentType: 'text/plain',
    type: 'article',
    isBinary: false,
  },
  '.srt': {
    contentType: 'text/plain',
    type: 'conversation',
    isBinary: false,
  },
  '.mp3': {
    contentType: 'audio/mp3',
    type: 'conversation',
    isBinary: true,
  },
  '.mp4': {
    contentType: 'audio/mpeg',
    type: 'conversation',
    isBinary: true,
  },
  '.wav': {
    contentType: 'audio/wav',
    type: 'conversation',
    isBinary: true,
  },
  '.html': {
    contentType: 'text/plain',
    type: 'article',
    isBinary: false,
  },
  '.csv': {
    contentType: 'text/csv',
    type: 'article',
    isBinary: false,
  },
  '.pdf': {
    contentType: 'text/pdf',
    type: 'article',
    isBinary: true,
  },
};

function prepFileInput(input: _Input<File>): _Input<File> {
  const ext = path.extname(input.text.filePath);
  if (!(ext in extensions)) throw new Error(`Unsupported file type: ${ext}`);
  const { contentType, type, isBinary } = extensions[ext];

  return {
    encoding: (isBinary) ? 'base64' : 'utf8',
    contentType,
    type,
    ...input,
    text: (input.text.buffer !== undefined) ? input.text : {
      ...(input.text as File),
      buffer: fs.readFileSync(input.text.filePath),
    },
  };
}

export function wrapContent<T extends TextContent>(
  content: _Input<T> | T,
): _Input<T> {
  if (typeof content === 'string') {
    return {
      text: content,
      type: 'article',
    };
  }
  if (isInput(content)) {
    if (isFile(content.text)) return prepFileInput(content as _Input<File>) as _Input<T>;
    return content;
  }
  if (isFile(content)) return prepFileInput({ text: content }) as _Input<T>;
  return {
    text: content,
    type: 'conversation',
    contentType: 'application/json',
  };
}

export interface Span {
  start: number,
  end: number,
  section: number,
}

export interface Label {
  skill: string
  type: string
  name: string
  /** @deprecated since version 0.2.0, use `outputSpans` instead */
  span: number[]
  /** @deprecated since version 0.4.0, use `spanText` instead */
  span_text: string
  spanText: string
  outputSpans: Span[]
  inputSpans: Span[]
  value: number | string
  data: Record<string, any>
  timestamp?: number
  timestampEnd?: number
}

export interface Output extends Input, OutputFields {
  text: TextContent
  requestId?: string
  stats?: {
    concurrencyWaitTime?: number,
    totalRunningJobs?: number,
    totalWaitingJobs?: number,
    wordCount?: number,
    transcriptionSecondsCount?: number,
  }
  [key: string]: (Output | Label[] | TextContent | any)
}

export interface AsyncApiTask {
  id: string,
  name: string,
  skills: Skill[],
}

export interface AsyncApiResponse extends AsyncApiTask {
  status: 'COMPLETED' | 'FAILED' | 'RUNNING',
  result?: Output | OneAIError,
}
