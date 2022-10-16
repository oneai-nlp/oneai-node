/* eslint-disable no-await-in-loop */
import { _Input } from '../classes';
import { Paginated } from '../clustering';
import { ApiClient, ApiReqParams } from './client';
import { buildClusteringItems } from './mapping';

export default class ClusteringApiClient extends ApiClient {
  rootPath = 'clustering/v1/collections';

  async get(path: string, params?: ApiReqParams): Promise<any> {
    return super.get(`${this.rootPath}/${path}`, params);
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
    const { data } = await this.post(
      `${this.rootPath}/${path}`,
      buildClusteringItems(items, params?.forceNewClusters, params?.forceClusterId),
      params,
    );
    return data;
  }
}
