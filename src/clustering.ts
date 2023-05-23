/* eslint-disable no-await-in-loop */
import { ApiReqParams } from './api/client';
import ClusteringApiClient from './api/clustering';
import { buildClusteringQueryParams } from './api/mapping';
import { _Input } from './model/pipeline';

export type Paginated<T> = AsyncGenerator<T, void>

export type ClusteringApiParams = ApiReqParams & {
  sort?: 'ASC' | 'DESC',
  limit?: number,
  fromDate?: Date | string,
  toDate?: Date | string,
  itemMetadata?: string,
};

export class Item {
  id: number;

  text: string;

  createdAt: Date;

  distance: number;

  phrase?: Phrase;

  constructor(
    id: number,
    text: string,
    createdAt: Date,
    distance: number,
    phrase?: Phrase,
  ) {
    this.id = id;
    this.text = text;
    this.createdAt = createdAt;
    this.distance = distance;
    this.phrase = phrase;
  }

  toJSON() {
    return {
      type: 'item',
      id: this.id,
      text: this.text,
      createdAt: this.createdAt,
      distance: this.distance,
      phraseId: this.phrase?.id,
    };
  }

  static fromJSON(phrase: Phrase | undefined, item: any): Item {
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
    params?: ClusteringApiParams,
  ): AsyncGenerator<Item, void, undefined> {
    const urlParams = buildClusteringQueryParams(params);
    /* istanbul ignore next */
    yield* this.cluster.collection.client.getPaginated(
      `${this.cluster.collection.id}/phrases/${this.id}/items?${urlParams}`,
      'items',
      (item: any) => Item.fromJSON(this, item),
      params?.limit,
      params,
    );
  }

  toJSON() {
    return {
      type: 'phrase',
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

  collection: _Collection;

  constructor(
    params: {
      id: number,
      text?: string,
      phraseCount?: number,
      metadata?: any,
      collection: _Collection,
    },
  ) {
    this.id = params.id;
    this.text = params.text;
    this.phraseCount = params.phraseCount;
    this.collection = params.collection;
    this.metadata = params.metadata;
  }

  async* getPhrases(
    params?: ClusteringApiParams,
  ): AsyncGenerator<Phrase, void, undefined> {
    const urlParams = buildClusteringQueryParams(params);
    /* istanbul ignore next */
    yield* this.collection.client.getPaginated(
      `${this.collection.id}/clusters/${this.id}/phrases?${urlParams}`,
      'phrases',
      (phrase) => Phrase.fromJSON(this, phrase),
      params?.limit,
      params,
    );
  }

  async* getItems(
    params?: ClusteringApiParams,
  ): AsyncGenerator<Item, void, undefined> {
    const urlParams = buildClusteringQueryParams(params);
    /* istanbul ignore next */
    yield* this.collection.client.getPaginated(
      `${this.collection.id}/clusters/${this.id}/items?${urlParams}`,
      'items',
      (item) => Item.fromJSON(undefined, item),
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
      type: 'cluster',
      id: this.id,
      text: this.text,
      phraseCount: this.phraseCount,
      metadata: this.metadata,
      collectionId: this.collection.id,
    };
  }

  static fromJSON(collection: _Collection, cluster: any): Cluster {
    return new Cluster({
      id: cluster.cluster_id,
      text: cluster.cluster_phrase,
      phraseCount: cluster.phrases_count,
      collection,
      metadata: cluster.metadata,
    });
  }
}

export abstract class _Collection {
  static apiDateFormat = '%Y-%m-%d';

  abstract client: ClusteringApiClient;

  id: string;

  params?: ApiReqParams;

  constructor(id: string, params?: ApiReqParams) {
    this.id = id;
    this.params = params;
  }

  async* getClusters(
    params?: ClusteringApiParams,
  ): Paginated<Cluster> {
    const urlParams = buildClusteringQueryParams(params);
    /* istanbul ignore next */
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
      .../* istanbul ignore next */(
        params?.threshold && { 'similarity-threshold': params.threshold.toString() }
      ),
    });

    const { data } = await this.client.get(`${this.id}/clusters/find?${urlParams}`, params);
    return data.map((cluster: any) => Cluster.fromJSON(this, cluster)) || [];
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
      type: 'collection',
      id: this.id,
    };
  }
}

export const createCollectionClass = (
  client: ClusteringApiClient,
) => class Collection extends _Collection {
  client: ClusteringApiClient = client;

  static async* getCollections(
    params?: ClusteringApiParams,
  ): Paginated<Collection> {
    const urlParams = buildClusteringQueryParams(params);
    /* istanbul ignore next */
    yield* client.getPaginated(
      `?${urlParams}`,
      'collections',
      (id: string) => (
          new Collection(id, params)
        ) as Collection,
      params?.limit,
    );
  }

  static async getTaskStatus(
    taskId: string,
    params?: ClusteringApiParams,
  ): Promise<{status: string, content?: any}> {
    const urlParams = buildClusteringQueryParams(params);
    /* istanbul ignore next */
    return client.get(
      `status/${taskId}?${urlParams}`,
      params,
    );
  }
};
