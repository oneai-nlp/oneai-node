/* eslint-disable no-await-in-loop */
import { ApiReqParams } from './api/client';
import ClusteringApiClient from './api/clustering';
import { _Input } from './classes';

export type Paginated<T> = AsyncGenerator<T, void>

export class ClusteringClient {
  private baseURL = 'https://api.oneai.com/clustering/v1/collections';

  private client: ClusteringApiClient;

  Item = ClusteringClient.Item;

  Phrase = ClusteringClient.Phrase;

  Cluster = ClusteringClient.Cluster;

  Collection = ((cclient: ClusteringClient) => class extends ClusteringClient.Collection {
    client: ClusteringApiClient = cclient.client;
  })(this);

  constructor(client: ClusteringApiClient) {
    this.client = client;
  }

  async* getCollections(
    apiKey?: string,
    limit?: number,
  ): Paginated<ClusteringClient.Collection> {
    const urlParams = new URLSearchParams();
    if (limit) urlParams.set('limit', limit.toString());

    yield* this.client.getPaginated(
      `?${urlParams}`,
      'collections',
      (id: string) => (new this.Collection(id, apiKey)) as ClusteringClient.Collection,
      limit,
    );
  }
}

export namespace ClusteringClient {
  export class Item {
    id: number;

    text: string;

    createdAt: Date;

    distance: number;

    phrase: Phrase;

    constructor(
      id: number,
      text: string,
      createdAt: Date,
      distance: number,
      phrase: Phrase,
    ) {
      this.id = id;
      this.text = text;
      this.createdAt = createdAt;
      this.distance = distance;
      this.phrase = phrase;
    }

    toJSON() {
      return {
        id: this.id,
        text: this.text,
        createdAt: this.createdAt,
        distance: this.distance,
        phraseId: this.phrase.id,
      };
    }

    static fromJSON(phrase: Phrase, item: any): Item {
      return new Item(
        item.id,
        item.original_text,
        new Date(item.created_at),
        item.distance_to_phrase,
        phrase,
      );
    }
  }

  export class Phrase {
    id: number;

    text: string;

    itemCount: number;

    metadata?: any;

    cluster: Cluster;

    constructor(
      id: number,
      text: string,
      itemCount: number,
      cluster: Cluster,
      metadata?: any,
    ) {
      this.id = id;
      this.text = text;
      this.itemCount = itemCount;
      this.cluster = cluster;
      this.metadata = metadata;
    }

    async* getItems(
      params?: ApiReqParams & {
        itemMetadata?: string,
      },
    ): AsyncGenerator<Item, void, undefined> {
      const urlParams = new URLSearchParams();
      if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params?.itemMetadata!);

      yield* this.cluster.collection.client.getPaginated(
        `${this.cluster.collection.id}/phrases/${this.id}/items?${urlParams}`,
        'items',
        (item) => Item.fromJSON(this, item),
        undefined,
        params,
      );
    }

    toJSON() {
      return {
        id: this.id,
        text: this.text,
        itemCount: this.itemCount,
        metadata: this.metadata,
        clusterId: this.cluster.id,
      };
    }

    static fromJSON(cluster: Cluster, phrase: any): Phrase {
      return new Phrase(
        phrase.phrase_id,
        phrase.text,
        phrase.items_count,
        cluster,
        phrase.metadata,
      );
    }
  }

  export class Cluster {
    id: number;

    text?: string;

    phraseCount?: number;

    metadata?: any;

    collection: Collection;

    constructor(
      params: {
        id: number,
        text?: string,
        phraseCount?: number,
        metadata?: any,
        collection: Collection,
      },
    ) {
      this.id = params.id;
      this.text = params.text;
      this.phraseCount = params.phraseCount;
      this.collection = params.collection;
      this.metadata = params.metadata;
    }

    async* getPhrases(
      params?: ApiReqParams & {
        sort?: 'ASC' | 'DESC',
        limit?: number,
        fromDate?: Date | string,
        toDate?: Date | string,
        itemMetadata?: string,
      },
    ): AsyncGenerator<Phrase, void, undefined> {
      const urlParams = new URLSearchParams();
      const fromDate = (typeof params?.fromDate === 'string') ? new Date(params?.fromDate) : params?.fromDate;
      const toDate = (typeof params?.toDate === 'string') ? new Date(params?.toDate) : params?.toDate;

      urlParams.set('include-items', 'false');
      if (params?.sort !== undefined) urlParams.set('sort', params.sort);
      if (params?.limit !== undefined) urlParams.set('limit', params.limit.toString());
      if (fromDate !== undefined) urlParams.set('from-date', fromDate.toISOString());
      if (toDate !== undefined) urlParams.set('to-date', toDate.toISOString());
      if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params.itemMetadata);

      yield* this.collection.client.getPaginated(
        `${this.collection.id}/clusters/${this.id}/phrases?${urlParams}`,
        'clusters',
        (phrase) => Phrase.fromJSON(this, phrase),
        params?.limit,
        params,
      );
    }

    async addItems(
      items: _Input<string>[],
      params?: ApiReqParams,
    ): Promise<any> {
      return this.collection.client.postItems(
        `${this.collection.id}/items`,
        items,
        {
          forceClusterId: this.id,
          ...params,
        },
      );
    }

    toJSON() {
      return {
        id: this.id,
        text: this.text,
        phraseCount: this.phraseCount,
        metadata: this.metadata,
        collectionId: this.collection.id,
      };
    }

    static fromJSON(collection: Collection, cluster: any): Cluster {
      return new Cluster({
        id: cluster.cluster_id,
        text: cluster.cluster_phrase,
        phraseCount: cluster.phrases_count,
        collection,
        metadata: cluster.metadata,
      });
    }
  }

  export abstract class Collection {
    static apiDateFormat = '%Y-%m-%d';

    abstract client: ClusteringApiClient;

    id: string;

    apiKey?: string;

    constructor(id: string, apiKey?: string) {
      this.id = id;
      this.apiKey = apiKey;
    }

    async* getClusters(
      params?: ApiReqParams & {
        sort?: 'ASC' | 'DESC',
        limit?: number,
        fromDate?: Date | string,
        toDate?: Date | string,
        itemMetadata?: string,
      },
    ): Paginated<Cluster> {
      const urlParams = new URLSearchParams();
      const fromDate = (typeof params?.fromDate === 'string') ? new Date(params?.fromDate) : params?.fromDate;
      const toDate = (typeof params?.toDate === 'string') ? new Date(params?.toDate) : params?.toDate;

      urlParams.set('include-phrases', 'false');
      if (params?.sort !== undefined) urlParams.set('sort', params.sort);
      if (params?.limit !== undefined) urlParams.set('limit', params.limit.toString());
      if (fromDate !== undefined) urlParams.set('from-date', fromDate.toISOString());
      if (toDate !== undefined) urlParams.set('to-date', toDate.toISOString());
      if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params.itemMetadata);

      yield* this.client.getPaginated(
        `${this.id}/clusters?${urlParams}`,
        'clusters',
        (cluster) => Cluster.fromJSON(this, cluster),
        params?.limit,
        params,
      );
    }

    async find(
      query: string,
      params?: ApiReqParams & {
        threshold: number,
      },
    ): Promise<Cluster[]> {
      const urlParams = new URLSearchParams({
        text: query,
        ...params?.threshold && { 'similarity-threshold': params.threshold.toString() },
      });

      const clusters = await this.client.get(`${this.id}/clusters/find?${urlParams}`, params);
      return clusters.map((cluster: any) => Cluster.fromJSON(this, cluster)) || [];
    }

    async addItems(
      items: _Input<string>[],
      params?: ApiReqParams & {
        forceNewClusters: boolean,
      },
    ): Promise<any> {
      return this.client.postItems(
        `${this.id}/items`,
        items,
        params,
      );
    }

    toJSON() {
      return {
        id: this.id,
      };
    }
  }
}
