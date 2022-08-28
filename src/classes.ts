import * as path from 'path';
import * as fs from 'fs';
import parseConversation from './parsing';
import type { OutputFields } from './skills';

export interface Skill {
  apiName: string
  isGenerator?: boolean
  params?: object
  labelType?: string
  outputField?: string
  outputField1?: string
}

export type inputType = 'article' | 'conversation' | undefined;
export type encoding = 'utf8' | 'base64';

export type FileContent = {
  filePath: string,
  buffer: Buffer,
};
export type ConversationContent = {
  speaker: string,
  utterance: string,
}[];

export type TextContent = string | ConversationContent | FileContent;

export function isInput(object: any): object is Input {
  return 'text' in object;
}

export function isFileContent(object: any): object is FileContent {
  return 'filePath' in object && 'buffer' in object;
}

export interface Input {
  text?: TextContent;
  type?: inputType;
  contentType?: string;
  encoding?: encoding;
}

export class Document implements Input {
  type: inputType = 'article';

  text: string;

  constructor(text: string) {
    this.text = text;
  }
}

export interface Utterance {
  speaker: string,
  utterance: string
}

export class Conversation implements Input {
  type: inputType = 'conversation';

  utterances: Utterance[];

  constructor(utterances: Utterance[]) {
    this.utterances = utterances;
  }

  static parse(text: string): Conversation {
    return new Conversation(parseConversation(text));
  }
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

export class File implements Input {
  type: inputType;

  contentType?: string;

  encoding: encoding;

  text: FileContent;

  constructor(fileContent: string | FileContent, inputType?: inputType) {
    this.type = inputType;

    const loadFile = typeof fileContent === 'string';
    const filePath = (loadFile) ? fileContent : fileContent.filePath;
    const buffer = (loadFile) ? fs.readFileSync(filePath) : fileContent.buffer;

    const ext = path.extname(filePath);
    if (!(ext in extensions)) throw new Error(`Unsupported file type: ${ext}`);
    const { contentType, type, isBinary } = extensions[ext];

    this.contentType = contentType;
    this.type = type;

    this.text = { filePath, buffer };
    this.encoding = (isBinary) ? 'base64' : 'utf8';
  }

  read(): Input {
    return {
      text: this.text.buffer.toString(this.encoding),
      encoding: this.encoding,
      contentType: this.contentType,
      type: this.type,
    };
  }
}

export function wrapContent(content: Input | TextContent, sync: boolean): Input {
  if (isInput(content)) {
    if (!isFileContent(content.text) || !sync) return content;
    return (content as File).read();
  }
  if (typeof content === 'string') {
    return {
      text: content,
      type: 'article',
      encoding: 'utf8',
      contentType: 'text/plain',
    };
  }
  if (isFileContent(content)) {
    const f = new File(content);
    return (sync) ? f.read() : f;
  }
  return {
    text: content,
    type: 'conversation',
    encoding: 'utf8',
    contentType: 'application/json',
  };
}

interface Span {
  start: number,
  end: number,
  section: number,
}

export interface Label {
  type: string
  name: string
  /** @deprecated since version 0.2.0, use `outputSpans` instead */
  span: number[]
  span_text: string
  outputSpans: Span[]
  inputSpans: Span[]
  value: number | string
  data: object
}

export interface Output extends Input, OutputFields {
  text: TextContent
  [key: string]: (Output | Label[] | TextContent | any)
}
