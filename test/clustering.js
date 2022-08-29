/* eslint-disable no-restricted-syntax */
const { describe, it } = require('mocha');
const { expect } = require('chai');
const { apiKey } = require('./credentials.json');
const OneAI = require('../lib/src/index');

const oneai = new OneAI(apiKey);

describe('Clustering', () => {
  it('collection', async () => {
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
    expect(await collection.addItems(items)).to.have.property('status');
  });

  it('getCollections', async () => {
    for await (const collection of oneai.clustering.getCollections()) {
      console.log(collection.name);
      for await (const cluster of collection.getClusters({ limit: 1 })) {
        console.log(`\t${cluster.text}`);
        const phrase = (await cluster.getPhrases().next()).value;
        console.log(`\t\t${phrase.text}`);
        try {
          const item = (await phrase.getItems())[0];
          console.log(`\t\t\t${item.text}`);
        } catch (e) {
          console.log(e);
          throw e;
        }
      }
    }
  });
});
