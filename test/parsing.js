/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const { describe, it } = require('mocha');
const OneAI = require('../lib/src/index');
const { conversationParsingTests } = require('./constants.json');
const transcriptionOutput = require('./transcriptionOutput.json');

const oneai = new OneAI();

describe('parseConversation', () => {
  conversationParsingTests.forEach((test, index) => {
    it(`test ${index} - ${test.desc}`, () => {
      let parsed;
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
    const parsed = oneai.parsing.toSRT(transcriptionOutput, { maxLengthCharacters: 30 });
    console.log(parsed);
  });
});
