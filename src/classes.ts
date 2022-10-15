import * as path from 'path';
import type { OutputFields } from './skills';
import { OneAIError } from './errors';

export interface Skill {
  apiName: string
  params?: object
  textField?: string
  labelsField?: string
}

export type FileContent = {
  filePath: string,
  buffer: Buffer,
};
export type ConversationContent = {
  speaker: string,
  utterance: string,
}[];

export type TextContent = string | ConversationContent | FileContent;

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

export function isFileContent(object: any): object is FileContent {
  return typeof object === 'object' && 'filePath' in object && 'buffer' in object;
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
};

export function wrapContent<T extends TextContent>(
  content: _Input<T> | T,
): _Input<T> {
  if (isInput(content)) return content;
  if (typeof content === 'string') {
    return {
      text: content,
      type: 'article',
    };
  }
  if (isFileContent(content)) {
    const ext = path.extname(content.filePath);
    if (!(ext in extensions)) throw new Error(`Unsupported file type: ${ext}`);
    const { contentType, type, isBinary } = extensions[ext];

    return {
      text: content,
      encoding: (isBinary) ? 'base64' : 'utf8',
      contentType,
      type,
    };
  }
  return {
    text: content,
    type: 'conversation',
    contentType: 'application/json',
  };
}

interface Span {
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
  data: object
  timestamp?: number
  timestampEnd?: number
}

export interface Output extends Input, OutputFields {
  text: TextContent
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
