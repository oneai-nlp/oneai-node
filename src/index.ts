import createPipelineClass from './pipeline';
import {
  Conversation, Output,
} from './classes';
import {
  Cluster, createCollectionClass, Item, Phrase,
} from './clustering';
import { skills } from './skills';
import { parseConversation } from './parsing/conversation';
import toSRT from './parsing/srt';
import PipelineApiClient from './api/pipeline';
import {
  HttpApiClient, ApiClientAxios, ApiClientParams,
} from './api/client';
import Logger from './logging';
import ClusteringApiClient from './api/clustering';

class OneAI {
/**
 * A Language Skill is a package of trained NLP models.
 * Skills accept text and respond with processed texts and extracted metadata.
 *
 * Process texts with Skills using `Pipeline`s
 */
  readonly skills = skills;

  static skills = skills;

  private apiClientBase: HttpApiClient;

  private pipelineApiClient: PipelineApiClient;

  private clusteringApiClient: ClusteringApiClient;

  logger: Logger;

  static defaultParams: ApiClientParams = {
    apiKey: '',
    timeout: 60,
    baseURL: 'https://api.oneai.com',
  };

  params: ApiClientParams;

  constructor(
    apiKey?: string,
    params?: Partial<ApiClientParams & { client: HttpApiClient }>,
  ) {
    this.params = {
      ...OneAI.defaultParams,
      ...params !== undefined && params,
      ...apiKey !== undefined && { apiKey },
    };

    this.logger = new Logger();
    this.apiClientBase = params?.client ?? new ApiClientAxios(this.params);
    this.pipelineApiClient = new PipelineApiClient(this.apiClientBase, this.logger);
    this.Pipeline = createPipelineClass(this.pipelineApiClient);

    this.clusteringApiClient = new ClusteringApiClient(this.apiClientBase, this.logger);
    const Collection = createCollectionClass(this.clusteringApiClient);
    this.clustering = {
      Item,
      Phrase,
      Cluster,
      Collection,
      getCollections: Collection.getCollections,
    };
  }

  Pipeline;

  clustering;

  parsing: {
    parseConversation: (input: string) => Conversation,
    toSRT: (
      output: Output,
      params?: {
        maxLengthWords?: number,
        maxLengthCharacters?: number,
      },
    ) => string,
  } = {
      parseConversation,
      toSRT,
    };

  static OneAI = OneAI;

  public toString(): string {
    const apiKeyString = (this.params.apiKey?.length >= 8) ? this.params.apiKey.substring(0, 8) + '*'.repeat(this.params.apiKey.length - 8) : undefined;
    return `One AI Client - API Key ${apiKeyString}`;
  }
}

export {
  HttpApiClient, ApiClientParams, ApiReqParams, HttpResponse,
} from './api/client';
export {
  Label, Skill, File, Conversation, TextContent,
  Input, Span, Output, AsyncApiTask, AsyncApiResponse,
} from './classes';
export {
  // eslint-disable-next-line no-restricted-exports
  Logger, skills, OneAI, OneAI as default,
};
