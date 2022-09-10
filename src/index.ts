import createPipelineClass from './pipeline';
import {
  File, Document, Conversation, ConversationContent, Output,
} from './classes';
import { ClusteringClient } from './clustering';
import { skills } from './skills';
import parseConversation from './parsing/conversation';
import toSRT from './parsing/srt';
import PipelineApiClient from './api/pipeline';
import { ApiClientParams } from './api/client';
import Logger from './logging';

type OneAIClientParams = ApiClientParams & {
  loggingEnabled: boolean,
};

class OneAI {
/**
 * A Language Skill is a package of trained NLP models.
 * Skills accept text and respond with processed texts and extracted metadata.
 *
 * Process texts with Skills using `Pipeline`s
 */
  readonly skills = skills;

  static skills = skills;

  /**
   * @deprecated since version 0.4.0, use `FileContent` inputs or
   * `pipeline.runFile()` method instead
   */
  File = File;

  /** @deprecated since version 0.4.0, use `Utterance[]` inputs instead */
  Conversation = Conversation;

  /** @deprecated since version 0.4.0, use `string` inputs instead */
  Document = Document;

  private pipelineApiClient: PipelineApiClient;

  private logger: Logger;

  static defaultParams: OneAIClientParams = {
    apiKey: '',
    timeout: 60,
    baseURL: 'https://api.oneai.com',
    loggingEnabled: true,
  };

  params: OneAIClientParams;

  constructor(
    apiKey?: string,
    params?: Partial<OneAIClientParams>,
  ) {
    this.params = {
      ...OneAI.defaultParams,
      ...params !== undefined && params,
      ...apiKey !== undefined && { apiKey },
    };

    this.logger = new Logger(this.params.loggingEnabled);
    this.pipelineApiClient = new PipelineApiClient(this.params, this.logger);
    this.Pipeline = createPipelineClass(this.pipelineApiClient);
  }

  Pipeline;

  clustering = new ClusteringClient(this);

  parsing: {
    parseConversation: (input: string) => ConversationContent,
    toSRT: (output: Output) => string,
  } = {
      parseConversation,
      toSRT,
    };

  static OneAI = OneAI;

  public toString(): string {
    const apiKeyString = (this.params.apiKey) ? this.params.apiKey.substring(0, 8) + '*'.repeat(this.params.apiKey.length - 8) : undefined;
    return `One AI Client - API Key ${apiKeyString}`;
  }
}
export = OneAI;
