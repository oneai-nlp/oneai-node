/* eslint-disable no-restricted-syntax */
import { expect } from 'chai';
import { Cluster, Phrase, _Collection } from '../src/clustering';
import oneai from './testClient';

describe('Clustering', () => {
  describe('add items', () => {
    const collection = new oneai.clustering.Collection('test-collection');
    const items = [
      {
        text: 'Can not access account',
      },
      {
        text: 'I cannot access my account',
      },
      {
        text: 'Can not enter my account',
      },
      {
        text: 'Cancel order',
      },
      {
        text: 'I want to cancel my order',
      },
      {
        text: 'How do I cancel my order?',
      },
      {
        text: 'Need help cancelling order',
      },
    ];

    it('collection', async () => {
      expect(await collection.addItems(items)).to.have.property('status');
    });
    it('cluster', async () => {
      const cluster = (await collection.find('Can not access account'))[0];
      expect(await cluster.addItems(items.slice(0, 1))).to.have.property('status');
    });
  });

  describe('get', () => {
    let collection: _Collection;
    let cluster: Cluster;
    let phrase: Phrase;

    it('get collections', async () => {
      collection = (await oneai.clustering.getCollections({ limit: 1 }).next()).value!;
      expect(collection).to.have.property('id');
      expect(collection.toJSON().id).to.equal(collection.id);
    });

    it('get clusters', async () => {
      cluster = (await collection.getClusters({ limit: 1 }).next()).value!;
      expect(cluster).to.have.property('collection');
      expect(cluster.toJSON().id).to.equal(cluster.id);
    });

    it('get phrases', async () => {
      phrase = (await cluster.getPhrases({ limit: 1 }).next()).value!;
      expect(phrase).to.have.property('cluster');
      expect(phrase.toJSON().id).to.equal(phrase.id);
    });

    it('get items', async () => {
      const item = (await phrase.getItems({ limit: 1 }).next()).value!;
      expect(item).to.have.property('phrase');
      expect(item.toJSON().id).to.equal(item.id);
    });
  });
});
