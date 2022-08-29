/* eslint-disable no-await-in-loop */
import axios from 'axios';
import OneAI from '.';
import { _Input } from './classes';

export class ClusteringClient {
  private baseURL = 'https://api.oneai.com/clustering/v1/collections';

  private client: OneAI;

  Item = ClusteringClient.Item;

  Phrase = ClusteringClient.Phrase;

  Cluster = ClusteringClient.Cluster;

  Collection = ((cclient: ClusteringClient) => class extends ClusteringClient.Collection {
    client: ClusteringClient = cclient;
  })(this);

  constructor(client: OneAI) {
    this.client = client;
  }

  GET(path: string, apiKey?: string): Promise<any> {
    const key = apiKey || this.client.apiKey;
    if (!key) throw new Error('API key is required');
    return axios({
      method: 'GET',
      url: `${this.baseURL}/${path}`,
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
      },
    });
  }

  POST(path: string, apiKey?: string, data: object = {}) {
    const key = apiKey || this.client.apiKey;
    if (!key) throw new Error('API key is required');
    return axios({
      method: 'POST',
      url: `${this.baseURL}/${path}`,
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
      },
      data,
    });
  }

  async* getCollections(
    apiKey?: string,
    limit?: number,
  ): AsyncGenerator<ClusteringClient.Collection, void, undefined> {
    const urlParams = new URLSearchParams();
    if (limit) urlParams.set('limit', limit.toString());
    let page = 0;
    let collections: ClusteringClient.Collection[] = [];
    let counter = 0;

    while ((page === 0 || collections.length > 0) && (limit === undefined || counter < limit)) {
      urlParams.set('page', (page++).toString());

      const { data } = await this.GET(`?${urlParams}`, apiKey);
      collections = data ? data.map(
        (name: string) => new this.Collection(name, apiKey),
      ) : [];
      counter += collections.length;
      yield* collections;
    }
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

    static fromJson(phrase: Phrase, item: any): Item {
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

    async getItems(
      params?: {
        itemMetadata?: string,
      },
    ): Promise<Item[]> {
      const urlParams = new URLSearchParams();
      if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params?.itemMetadata!);
      const { data } = await this.cluster.collection.client.GET(
        `${this.cluster.collection.name}/phrases/${this.id}/items?${urlParams}`,
        this.cluster.collection.apiKey,
      );
      return data ? data.map((item: any) => Item.fromJson(this, item)) : [];
    }

    static fromJson(cluster: Cluster, phrase: any): Phrase {
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

    text: string;

    phraseCount: number;

    metadata?: any;

    collection: Collection;

    constructor(
      id: number,
      text: string,
      phraseCount: number,
      collection: Collection,
      metadata?: any,
    ) {
      this.id = id;
      this.text = text;
      this.phraseCount = phraseCount;
      this.collection = collection;
      this.metadata = metadata;
    }

    async* getPhrases(
      params?: {
        sort?: 'ASC' | 'DESC',
        limit?: number,
        fromDate?: Date | string,
        toDate?: Date | string,
        itemLimit?: number,
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
      if (params?.itemLimit !== undefined) urlParams.set('phrases-limit', params.itemLimit.toString());
      if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params.itemMetadata);

      let page = 0;
      let phrases: Phrase[] = [];
      let counter = 0;

      while (
        (page === 0 || phrases.length > 0)
        && (params?.limit === undefined || counter < params?.limit)
      ) {
        urlParams.set('page', (page++).toString());

        const { data } = await this.collection.client.GET(
          `${this.collection.name}/clusters/${this.id}/phrases?${urlParams}`,
          this.collection.apiKey,
        );
        phrases = data ? data.map((phrase: any) => Phrase.fromJson(this, phrase)) : [];
        counter += phrases.length;
        yield* phrases;
      }
    }

    async addItems(items: _Input<string>[]): Promise<any> {
      const url = `${this.collection.name}/items`;
      const request = items.map((item) => ({
        text: item.text,
        item_metadata: item.metadata,
        'force-cluster-id': this.id,
      }));
      const { data } = await this.collection.client.POST(url, this.collection.apiKey, request);
      return data;
    }

    static fromJson(collection: Collection, cluster: any): Cluster {
      return new Cluster(
        cluster.cluster_id,
        cluster.cluster_phrase,
        cluster.phrases_count,
        collection,
        cluster.metadata,
      );
    }
  }

  export abstract class Collection {
    static apiDateFormat = '%Y-%m-%d';

    abstract client: ClusteringClient;

    name: string;

    apiKey?: string;

    constructor(name: string, apiKey?: string) {
      this.name = name;
      this.apiKey = apiKey;
    }

    async* getClusters(
      params?: {
        sort?: 'ASC' | 'DESC',
        limit?: number,
        fromDate?: Date | string,
        toDate?: Date | string,
        phraseLimit?: number,
        itemMetadata?: string,
      },
    ): AsyncGenerator<Cluster, void, undefined> {
      const urlParams = new URLSearchParams();
      const fromDate = (typeof params?.fromDate === 'string') ? new Date(params?.fromDate) : params?.fromDate;
      const toDate = (typeof params?.toDate === 'string') ? new Date(params?.toDate) : params?.toDate;

      urlParams.set('include-phrases', 'false');
      if (params?.sort !== undefined) urlParams.set('sort', params.sort);
      if (params?.limit !== undefined) urlParams.set('limit', params.limit.toString());
      if (fromDate !== undefined) urlParams.set('from-date', fromDate.toISOString());
      if (toDate !== undefined) urlParams.set('to-date', toDate.toISOString());
      if (params?.phraseLimit !== undefined) urlParams.set('phrases-limit', params.phraseLimit.toString());
      if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params.itemMetadata);

      let page = 0;
      let clusters: Cluster[] = [];
      let counter = 0;

      while (
        (page === 0 || clusters.length > 0)
        && (params?.limit === undefined || counter < params?.limit)
      ) {
        urlParams.set('page', (page++).toString());

        const { data } = await this.client.GET(`${this.name}/clusters?${urlParams}`, this.apiKey);
        clusters = data ? data.map((cluster: any) => Cluster.fromJson(this, cluster)) : [];
        counter += clusters.length;
        yield* clusters;
      }
    }

    async find(query: string, threshold: number): Promise<Cluster[]> {
      const urlParams = new URLSearchParams({
        text: query,
        'similarity-threshold': threshold.toString(),
      });

      const url = `${this.name}/clusters/find?${urlParams}`;
      const { data } = (await this.client.GET(url, this.apiKey));
      return data ? data.map((cluster: any) => Cluster.fromJson(this, cluster)) : [];
    }

    async addItems(items: _Input<string>[], forceNewClusters: boolean): Promise<any> {
      const url = `${this.name}/items`;
      const request = items.map((input) => ({
        text: input.text,
        item_metadata: input.metadata,
        'force-new-cluster': forceNewClusters,
      }));
      const { data } = await this.client.POST(url, this.apiKey, request);
      return data;
    }
  }
}
