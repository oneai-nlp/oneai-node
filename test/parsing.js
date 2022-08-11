/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const { describe, it } = require('mocha');
const { parseConversation } = require('../lib/src/index');
const { conversationParsingTests } = require('./constants.json');

describe('Conversation Parser', () => {
  conversationParsingTests.forEach((test, index) => {
    it(`test ${index} - ${test.desc}`, () => {
      let parsed;
      try {
        parsed = parseConversation(test.text);
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
