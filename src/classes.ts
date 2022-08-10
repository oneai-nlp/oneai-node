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

type inputType = 'article' | 'conversation' | undefined;
type encoding = 'utf8' | 'base64';

export type TextContent = string | {
  speaker: string,
  utterance: string,
}[];

export interface Input {
  text?: TextContent;
  type?: inputType;
  contentType?: string;
  encoding?: encoding;

  /** @deprecated since version 0.2.0, use property `text` instead */
  getText?(): string;
}

export class Document implements Input {
  type: inputType = 'article';

  text: string;

  constructor(text: string) {
    this.text = text;
  }

  getText(): string {
    return this.text;
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

  getText(): string {
    return JSON.stringify(this.utterances);
  }

  static parse(text: string): Conversation {
    return new Conversation(parseConversation(text));
  }
}

export class File implements Input {
  type: inputType;

  contentType?: string;

  encoding?: encoding;

  text: TextContent;

  constructor(filePath: string, type?: inputType) {
    this.type = type;

    const ext = path.extname(filePath);
    const buffer = fs.readFileSync(filePath);
    switch (ext) {
      case '.json':
        this.text = JSON.parse(buffer.toString());
        this.encoding = 'utf8';
        this.contentType = 'application/json';
        break;
      case '.txt':
        this.text = buffer.toString();
        this.encoding = 'utf8';
        this.contentType = 'text/plain';
        break;
      case '.srt':
        this.text = parseConversation(buffer.toString());
        this.encoding = 'utf8';
        this.contentType = 'application/json';
        break;
      case '.jpg':
      case '.jpeg':
        this.text = buffer.toString('base64');
        this.encoding = 'base64';
        this.contentType = 'image/jpeg';
        break;
      case '.mp3':
        this.text = buffer.toString('base64');
        this.encoding = 'base64';
        this.contentType = 'audio/mp3';
        break;
      case '.wav':
        this.text = buffer.toString('base64');
        this.encoding = 'base64';
        this.contentType = 'audio/wav';
        break;
      case '.html':
        this.text = buffer.toString();
        this.encoding = 'utf8';
        this.contentType = 'text/html';
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  getText(): string {
    return this.text.toString();
  }
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
