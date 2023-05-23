/* eslint-disable no-await-in-loop */
import { _Input } from '../model/pipeline';
import { Paginated } from '../clustering';
import Logger from '../logging';
import { HttpApiClient, ApiReqParams } from './client';
import { buildClusteringItems } from './mapping';

export default class ClusteringApiClient {
  private client: HttpApiClient;

  private logger?: Logger;

  rootPath = 'clustering/v1/collections';

  constructor(client: HttpApiClient, logger?: Logger) {
    this.client = client;
    this.logger = logger;
  }

  async get(path: string, params?: ApiReqParams): Promise<any> {
    return this.client.get(`${this.rootPath}/${path}`, params);
  }

  async* getPaginated<T>(
    path: string,
    field: string,
    mapFn: (raw: any) => T,
    limit?: number,
    params?: ApiReqParams,
  ): Paginated<T> {
    let page = 0;
    let counter = 0;
    let nodes = [];

    const url = `${path}${path.includes('?') ? '&' : '?'}page=`;

    while (page === 0 || nodes.length > 0) {
      const { data } = await this.get(`${url}${page++}`, params);
      nodes = (field in data && Array.isArray(data[field])) ? data[field].map(mapFn) : [];

      for (const node of nodes) {
        yield node;
        if (limit && (++counter) >= limit) return;
      }
      page++;
    }
  }

  async postItems(
    path: string,
    items: _Input<string>[],
    params?: ApiReqParams & {
      forceNewClusters?: boolean,
      forceClusterId?: number,
    },
  ): Promise<any> {
    const { data } = await this.client.post(
      `${this.rootPath}/${path}`,
      JSON.stringify(buildClusteringItems(items, params?.forceNewClusters, params?.forceClusterId)),
      params,
    );
    return data;
  }
}
