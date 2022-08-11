const { expect } = require('chai');
const { describe, it } = require('mocha');
const constants = require('./constants.json');
const OneAI = require('../lib/src/index');

const oneai = new OneAI('8beaa5cc-02b6-46cf-baea-2c9f5828f382');

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

    it('document input (string)', testInput(constants.document));
    it('conversation input (object)', testInput(constants.conversation));
  });
});
