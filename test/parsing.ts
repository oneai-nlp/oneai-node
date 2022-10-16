/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiFs from 'chai-fs';
import { conversationParsingTests } from './constants.json';
import transcriptionOutput from './transcriptionOutput.json';
import oneai from './testClient';
import { OneAIError } from '../src/errors';

chai.use(chaiFs);
const { expect } = chai;

describe('parseConversation', () => {
  conversationParsingTests.forEach((test, index) => {
    it(`test ${index} - ${test.desc}`, () => {
      let parsed: any;
      try {
        parsed = oneai.parsing.parseConversation(test.text);
      } catch (e) {
        parsed = { error: e };
      }

      it('test 1', () => {
        expect(parsed).to.not.be.null;
        if (test.elements > 0) {
          expect(parsed?.error).to.not.be.null;
          expect(parsed?.utterances?.length).to.not.equal(test.elements);
        } else {
          expect(parsed?.error).to.be.null;
        }
      });
    });
  });
});

describe('subtitle', () => {
  describe('srt', () => {
    it('parse output', () => {
      const parsed = oneai.parsing.toSRT(transcriptionOutput as any, { maxLengthCharacters: 30 });
      expect('./test/testSRT.srt').to.be.a.file().with.content(parsed);
    });

    it('errors', () => {
      const testObject: any = {
        text: transcriptionOutput.text,
        transcription: undefined,
      };

      expect(() => oneai.parsing.toSRT(testObject)).to.throw(OneAIError);
      testObject.transcription = {
        text: transcriptionOutput.transcription.text,
        words: undefined,
        sentences: undefined,
      };

      expect(() => oneai.parsing.toSRT(testObject)).to.throw(OneAIError);
      testObject.transcription.words = transcriptionOutput.transcription.words;
      expect(() => oneai.parsing.toSRT(testObject)).to.throw(OneAIError);
    });
  });
});
