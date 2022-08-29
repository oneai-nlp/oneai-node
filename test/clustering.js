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
});
