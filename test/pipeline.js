const { expect } = require('chai');
const { describe, it } = require('mocha');
const { apiKey } = require('./credentials.json');
const constants = require('./constants.json');
const OneAI = require('../lib/src/index');

const oneai = new OneAI(apiKey);

describe('Pipeline', () => {
  const pipeline = new oneai.Pipeline(
    oneai.skills.topics(),
    oneai.skills.numbers(),
    oneai.skills.summarize(),
    oneai.skills.names(),
    oneai.skills.emotions(),
  );

  describe('single input', () => {
    function testInput(input) {
      return async () => {
        const output = await pipeline.run(input);

        expect(output).to.have.property('topics');
        expect(output).to.have.property('numbers');
        expect(output).to.have.property('summary');
        expect(output).to.have.deep.nested.property('summary.names');
        expect(output).to.have.deep.nested.property('summary.emotions');
      };
    }

    it('document', testInput(constants.document));
    it('conversation', testInput(constants.conversation));
    it('url', async () => {
      pipeline.steps.splice(0, 0, oneai.skills.htmlToArticle());
      const output = await pipeline.run(constants.urlInput);

      expect(output).to.have.property('htmlArticle');
      expect(output).to.have.deep.nested.property('htmlArticle.htmlFields');
      expect(output).to.have.deep.nested.property('htmlArticle.topics');
    });
  });
});
