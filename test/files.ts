import { expect } from 'chai';
import constants from './constants.json';
import oneai from './testClient';

describe('audio', () => {
  const pipeline = new oneai.Pipeline(
    oneai.skills.transcribe({ timestamp_per_word: true }),
    oneai.skills.splitBySentence(),
    oneai.skills.splitByTopic(),
    oneai.skills.proofread(),
    oneai.skills.numbers(),
    oneai.skills.sentiments(),
  );

  function testFile(input: string, sync: boolean, logging: boolean = true) {
    return async () => {
      oneai.logger.enabled = logging;
      const output = await pipeline.runFile(input, { sync }); // true by default

      expect(output).to.have.property('transcription');
      expect(output).to.have.deep.nested.property('transcription.sentences');
      expect(output).to.have.deep.nested.property('transcription.segments');
      expect(output).to.have.deep.nested.property('transcription.proofread');
      expect(output).to.have.deep.nested.property('transcription.proofread.replacements');
      expect(output).to.have.deep.nested.property('transcription.proofread.numbers');
      expect(output).to.have.deep.nested.property('transcription.proofread.sentiments');
    };
  }

  describe('mp3', () => {
    it('sync', testFile(constants.mp3Path, true));
    it('async', testFile(constants.mp3Path, false, false));
  });

  describe('wav', () => {
    it('async', testFile(constants.wavPath, false));
  });
});
