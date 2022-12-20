/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiFs from 'chai-fs';
import fs from 'fs';
import { conversationParsingTests, conversationLineTests } from './constants.json';
import transcriptionOutput from './transcriptionOutput.json';
import oneai from './testClient';
import { OneAIError } from '../src/errors';
import { comp4Test, parseSpeakerLine, parseConversation } from '../src/parsing/conversation';

chai.use(chaiFs);
const { expect } = chai;

describe('parse conversation', () => {
  conversationLineTests.forEach((test, index) => {
    it(`test 1.${index} - ${test.input}`, () => {
      const parsed = parseSpeakerLine(test.input);
      expect(parsed).to.satisfy((p: any) => comp4Test(p, test.output));
    });
  });
  conversationParsingTests.forEach((test, index) => {
    it(`test 2.${index} - ${test.desc}`, () => {
      let parsed: any;
      try {
        parsed = oneai.parsing.parseConversation(test.text);
      } catch (e) {
        parsed = { error: e };
      }

      if (test.elements > 0) {
        expect(parsed?.error).to.be.undefined;
        expect(parsed?.length).to.equal(test.elements);
      } else {
        expect(parsed?.error).to.not.be.undefined;
      }
    });
  });

  it('full conversation', () => {
    const rawConv = fs.readFileSync('./test/testConv.txt', 'utf8');
    const parsed = parseConversation(rawConv);
    console.log(parsed);
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
