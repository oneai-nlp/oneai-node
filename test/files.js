const { expect } = require('chai');
const { describe, it } = require('mocha');
const { apiKey } = require('./credentials.json');
const constants = require('./constants.json');
const { OneAI } = require('../lib/src/index');

const oneai = new OneAI(apiKey);

describe('File inputs', () => {
  const pipeline = new oneai.Pipeline(
    oneai.skills.topics(),
    oneai.skills.numbers(),
    oneai.skills.summarize(),
    oneai.skills.names(),
    oneai.skills.emotions(),
  );

  function testFile(path) {
    return async () => {
      const output = await pipeline.run(new oneai.File(path));

      expect(output).to.have.property('transcription');
      expect(output).to.have.deep.nested.property('transcription.numbers');
      expect(output).to.have.deep.nested.property('transcription.summary');
      expect(output).to.have.deep.nested.property('transcription.summary.names');
      expect(output).to.have.deep.nested.property('transcription.summary.emotions');
    };
  }

  pipeline.steps[0] = oneai.skills.transcribe();
  // it('wav', testFile(constants.wavPath));
});
