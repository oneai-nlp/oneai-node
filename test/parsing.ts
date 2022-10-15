/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { conversationParsingTests } from './constants.json';
import transcriptionOutput from './transcriptionOutput.json';
import oneai from './testClient';

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
  it('srt', () => {
    const parsed = oneai.parsing.toSRT(transcriptionOutput as any, { maxLengthCharacters: 30 });
    console.log(parsed);
  });
});
