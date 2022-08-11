import { describe, it } from 'mocha';
import { expect } from 'chai';
import OneAI from '../src/index';

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

function validateOutput(input) {
  return () => {
    const output = pipeline.run(input);

    expect(output).to.have.property('topics');
    expect(output).to.have.property('numbers');
    expect(output).to.have.property('summary');
  };
}

describe('Pipeline', () => {
  describe('string input', () => {
    it('single input', validateOutput('hello world'));
  });
});
