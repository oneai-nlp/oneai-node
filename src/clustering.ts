/* eslint-disable no-await-in-loop */
import axios from 'axios';
import OneAI from '.';
import { _Input } from './classes';

const baseURL = 'https://api.oneai.com/clustering/v1/collections';

function GET(path: string, apiKey?: string) {
  if (!apiKey) throw new Error('API key is required');
  return axios({
    method: 'GET',
    url: `${baseURL}/${path}`,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
}

function POST(path: string, apiKey?: string, data: object = {}) {
  if (!apiKey) throw new Error('API key is required');
  return axios({
    method: 'POST',
    url: `${baseURL}/${path}`,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    data,
  });
}
// new URLSearchParams;
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

  cluster: Cluster;

  constructor(
    id: number,
    text: string,
    itemCount: number,
    cluster: Cluster,
  ) {
    this.id = id;
    this.text = text;
    this.itemCount = itemCount;
    this.cluster = cluster;
  }

  async getItems(
    params?: {
      itemMetadata?: string,
    },
  ): Promise<Item[]> {
    const urlParams = new URLSearchParams();
    if (params?.itemMetadata !== 'undefined') urlParams.set('item-metadata', params?.itemMetadata!);
    const { data } = await GET(`phrases/${this.id}/items?${urlParams}`, this.cluster.collection.apiKey);
    return data.map((item: any) => Item.fromJson(this, item));
  }

  static fromJson(cluster: Cluster, phrase: any): Phrase {
    return new Phrase(
      phrase.phrase_id,
      phrase.text,
      phrase.items_count,
      cluster,
    );
  }
}

export class Cluster {
  id: number;

  text: string;

  phraseCount: number;

  metadata: string;

  collection: _Collection;

  private cachedPhrases: Phrase[] = [];

  constructor(
    id: number,
    text: string,
    phraseCount: number,
    metadata: string,
    collection: _Collection,
  ) {
    this.id = id;
    this.text = text;
    this.phraseCount = phraseCount;
    this.metadata = metadata;
    this.collection = collection;
  }

  async getPhrases(
    params?: {
      itemMetadata?: string,
      cacheEnabled?: boolean,
    },
  ): Promise<Phrase[]> {
    if (params?.cacheEnabled) return this.cachedPhrases;

    const urlParams = new URLSearchParams();
    if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params?.itemMetadata);

    const url = `${this.collection.name}/clusters/${this.id}?${params}`;
    const { data } = (await GET(url, this.collection.apiKey));
    return data.map((cluster: any) => Phrase.fromJson(this, cluster));
  }

  async addItems(items: _Input<string>[]): Promise<any> {
    const url = `${this.collection.name}/items`;
    const request = items.map((item) => ({
      text: item.text,
      item_metadata: item.metadata,
      'force-cluster-id': this.id,
    }));
    const { data } = await POST(url, this.collection.apiKey, request);
    return data;
  }

  static fromJson(collection: _Collection, cluster: any): Cluster {
    const parsed = new Cluster(
      cluster.cluster_id,
      cluster.cluster_phrase,
      cluster.phrases_count,
      cluster.metadata,
      collection,
    );
    parsed.cachedPhrases = cluster.phrases.map((phrase: any) => Phrase.fromJson(parsed, phrase));
    return parsed;
  }
}

export abstract class _Collection {
  static apiDateFormat = '%Y-%m-%d';

  abstract client: OneAI;

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
      includePhrases?: boolean,
      phraseLimit?: number,
      itemMetadata?: string,
    },
  ): AsyncGenerator<Cluster, void, undefined> {
    const urlParams = new URLSearchParams();
    const fromDate = (typeof params?.fromDate === 'string') ? new Date(params?.fromDate) : params?.fromDate;
    const toDate = (typeof params?.toDate === 'string') ? new Date(params?.toDate) : params?.toDate;

    if (params?.sort !== undefined) urlParams.set('sort', params.sort);
    if (params?.limit !== undefined) urlParams.set('limit', params.limit.toString());
    if (fromDate !== undefined) urlParams.set('from-date', fromDate.toISOString());
    if (toDate !== undefined) urlParams.set('to-date', toDate.toISOString());
    if (params?.includePhrases !== undefined) urlParams.set('include-phrases', params.includePhrases.toString());
    if (params?.phraseLimit !== undefined) urlParams.set('phrases-limit', params.phraseLimit.toString());
    if (params?.itemMetadata !== undefined) urlParams.set('item-metadata', params.itemMetadata);

    let page = 0;
    let clusters: Cluster[] = [];

    while (page === 0 || clusters.length > 0) {
      urlParams.set('page', (page++).toString());

      const { data } = await GET(`${this.name}/clusters?${urlParams}`, (this.apiKey || this.client.apiKey)!);
      clusters = data.map((cluster: any) => Cluster.fromJson(this, cluster));
      yield* clusters;
    }
  }

  async find(query: string, threshold: number): Promise<Cluster[]> {
    const urlParams = new URLSearchParams({
      text: query,
      'similarity-threshold': threshold.toString(),
    });

    const url = `${this.name}/clusters/find?${urlParams}`;
    const { data } = (await GET(url, this.apiKey));
    return data.map((cluster: any) => Cluster.fromJson(this, cluster));
  }

  async addItems(items: _Input<string>[], forceNewClusters: boolean): Promise<any> {
    const url = `${this.name}/items`;
    const request = items.map((input) => ({
      text: input.text,
      item_metadata: input.metadata,
      'force-new-cluster': forceNewClusters,
    }));
    const { data } = await POST(url, this.apiKey, request);
    return data;
  }
}

export const Collection = (client: OneAI) => class extends _Collection { client = client; };

export async function* getCollections(
  client: OneAI,
  apiKey?: string,
  limit?: number,
): AsyncGenerator<_Collection, void, undefined> {
  if (!client.apiKey) throw new Error('API key is required');
  const urlParams = new URLSearchParams();
  if (limit) urlParams.set('limit', limit.toString());
  let page = 0;
  let collections: _Collection[] = [];

  while (page === 0 || collections.length > 0) {
    urlParams.set('page', (page++).toString());

    const { data } = await GET(`?${urlParams}`, apiKey || client.apiKey);
    collections = data.map(
      (collection: any) => new (Collection(client))(collection.name, apiKey || client.apiKey),
    );
    yield* collections;
  }
}
