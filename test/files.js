const { expect } = require('chai');
const { describe, it } = require('mocha');
// const { apiKey } = require('./credentials.json');
const constants = require('./constants.json');
const { OneAI } = require('../lib/src/index');

const oneai = new OneAI(process.env.API_KEY);

describe('audio', () => {
  const pipeline = new oneai.Pipeline(
    oneai.skills.transcribe({ timestamp_per_word: true }),
    oneai.skills.splitBySentence(),
    oneai.skills.splitByTopic(),
    oneai.skills.summarize(),
    oneai.skills.names(),
    oneai.skills.emotions(),
  );

  function testFile(input, sync) {
    return async () => {
      const output = await pipeline.runFile(input, { sync }); // true by default

      expect(output).to.have.property('transcription');
      expect(output).to.have.deep.nested.property('transcription.sentences');
      expect(output).to.have.deep.nested.property('transcription.segments');
      expect(output).to.have.deep.nested.property('transcription.summary');
      expect(output).to.have.deep.nested.property('transcription.summary.names');
      expect(output).to.have.deep.nested.property('transcription.summary.emotions');
    };
  }

  describe('mp3', () => {
    it('sync', testFile(constants.mp3Path, true));
    it('async', testFile(constants.mp3Path, false));
  });

  describe('wav', () => {
    it('async', testFile(constants.wavPath, false));
  });
});
