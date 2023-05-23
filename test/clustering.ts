/* eslint-disable no-restricted-syntax */
import { expect } from 'chai';
import { step } from 'mocha-steps';
import { Cluster, Phrase, _Collection } from '../src/clustering';
import oneai from './testClient';

describe('Clustering', () => {
  describe('create delete collection', () => {
    step('create collection', async () => {
      const collection = new oneai.clustering.Collection('test-collection-create-delete');
      await collection.create();
    });

    step('delete collection', async () => {
      const collection = new oneai.clustering.Collection('test-collection-create-delete');
      await collection.delete();
    });
  });

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

    step('get collections', async () => {
      collection = (await oneai.clustering.getCollections({ limit: 1 }).next()).value!;
      expect(collection).to.have.property('id');
      expect(collection.toJSON().id).to.equal(collection.id);
    });

    step('get clusters', async () => {
      cluster = (await collection.getClusters({ limit: 1 }).next()).value!;
      expect(cluster).to.have.property('collection');
      expect(cluster.toJSON().id).to.equal(cluster.id);
    });

    step('get phrases', async () => {
      phrase = (await cluster.getPhrases({ limit: 1 }).next()).value!;
      expect(phrase).to.have.property('cluster');
      expect(phrase.toJSON().id).to.equal(phrase.id);
    });

    step('get items from cluster', async () => {
      const item = (await cluster.getItems().next()).value!;
      expect(item).to.have.property('phrase');
      expect(item.phrase).to.have.property('cluster');
      expect(item.toJSON().id).to.equal(item.id);
    });

    step('get items from phrase', async () => {
      const item = (await phrase.getItems().next()).value!;
      expect(item).to.have.property('phrase');
      expect(item.toJSON().id).to.equal(item.id);
    });
  });

  describe('empty collection', async () => {
    let iter = 0;
    for await (const c of new oneai.clustering.Collection('empty-collection-keep-empty').getClusters()) {
      console.log(c);
      iter++;
    }
    expect(iter).to.equal(0);
  });
});
