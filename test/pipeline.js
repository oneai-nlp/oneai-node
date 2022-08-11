const { expect } = require('chai');
const { describe, it } = require('mocha');
const OneAI = require('../lib/src/index');

// TODO: start w/ real server responses, build fake server later
// Input -> Language Object, Output -> PipelineOutput?

const oneai = new OneAI('8beaa5cc-02b6-46cf-baea-2c9f5828f382');
const pipeline = new oneai.Pipeline(
  oneai.skills.topics(),
  oneai.skills.numbers(),
  oneai.skills.summarize(),
  oneai.skills.names(),
  oneai.skills.emotions(),
);

describe('Pipeline', () => {
  describe('string input', () => {
    it('single input', async () => {
      const output = await pipeline.run('hello world');

      expect(output).to.have.property('topics');
      expect(output).to.have.property('numbers');
      expect(output).to.have.property('summary');
    });
  });
});
