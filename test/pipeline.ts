/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TextContent } from '../src/classes';
import constants from './constants.json';
import oneai from './testClient';

describe('Pipeline', () => {
  it('skills', async () => {
    const pipeline = new oneai.Pipeline(
      oneai.skills.names(),
      oneai.skills.keywords(),
      oneai.skills.summarize(),
      oneai.skills.topics(),
      oneai.skills.emotions(),
      oneai.skills.highlights(),
      oneai.skills.headline(),
      oneai.skills.subheading(),
      oneai.skills.pricing(),
      oneai.skills.salesInsights(),
      oneai.skills.actionItems(),
      oneai.skills.detectLanguage(),
    );

    const output = await pipeline.run(constants.document);

    expect(output.text).to.not.be.undefined;
    expect(output.requestId).to.not.be.undefined;
    expect(output.stats).to.not.be.undefined;
    expect(output.stats?.concurrencyWaitTime).to.not.be.undefined;
    expect(output.stats?.totalRunningJobs).to.not.be.undefined;
    expect(output.stats?.totalWaitingJobs).to.not.be.undefined;
    expect(output.stats?.wordCount).to.not.be.undefined;
    expect(output.stats?.transcriptionSecondsCount).to.not.be.undefined;
    expect(output).to.have.property('names');
    expect(output).to.have.property('keywords');
    expect(output).to.have.property('summary');
    expect(output).to.have.deep.nested.property('summary.topics');
    expect(output).to.have.deep.nested.property('summary.emotions');
    expect(output).to.have.deep.nested.property('summary.highlights');
    expect(output).to.have.deep.nested.property('summary.headline');
    expect(output).to.have.deep.nested.property('summary.subheading');
    expect(output).to.have.deep.nested.property('summary.pricing');
    expect(output).to.have.deep.nested.property('summary.salesInsights');
    expect(output).to.have.deep.nested.property('summary.actionItems');
    expect(output).to.have.deep.nested.property('summary.language');
  });

  const pipeline = new oneai.Pipeline(
    oneai.skills.names(),
    oneai.skills.summarize(),
    oneai.skills.keywords(),
  );

  describe('single input', () => {
    function testInput(input: TextContent) {
      return async () => {
        const output = await pipeline.run(input);

        expect(output).to.have.property('names');
        expect(output).to.have.property('summary');
        expect(output).to.have.deep.nested.property('summary.keywords');
      };
    }

    it('document', testInput(constants.document));
    it('conversation', testInput(constants.conversation));
    it('url', async () => {
      pipeline.steps.splice(0, 0, oneai.skills.htmlToArticle());
      const output = await pipeline.run(constants.urlInput);

      expect(output).to.have.property('htmlArticle');
      expect(output).to.have.deep.nested.property('htmlArticle.htmlFields');
      expect(output).to.have.deep.nested.property('htmlArticle.names');
    });
  });

  it('batch input', async () => {
    const inputs = [
      constants.document,
      constants.conversation,
      constants.document,
      constants.conversation,
      constants.urlInput,
    ];
    const output = await pipeline.runBatch(inputs, {
      onOutput: (i: any, o: any) => {},
      onError: (i: any, e: any) => {},
    });
    expect(output.outputs.length).to.equal(4);
  });
});
