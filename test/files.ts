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

describe('polling', () => {
  const pipeline = new oneai.Pipeline(
    oneai.skills.transcribe({ timestamp_per_word: true }),
    oneai.skills.splitBySentence(),
    oneai.skills.splitByTopic(),
    oneai.skills.proofread(),
    oneai.skills.numbers(),
    oneai.skills.sentiments(),
  );
  it('separate', async () => {
    const { requestId } = await pipeline.runFile(constants.wavPath, { polling: false });
    const { status } = await pipeline.taskStatus(requestId);
    expect(status).to.be.oneOf(['COMPLETED', 'RUNNING']);
    const output = await pipeline.awaitTask(requestId);

    expect(output).to.have.property('transcription');
    expect(output).to.have.deep.nested.property('transcription.sentences');
    expect(output).to.have.deep.nested.property('transcription.segments');
    expect(output).to.have.deep.nested.property('transcription.proofread');
    expect(output).to.have.deep.nested.property('transcription.proofread.replacements');
    expect(output).to.have.deep.nested.property('transcription.proofread.numbers');
    expect(output).to.have.deep.nested.property('transcription.proofread.sentiments');
  });
});

describe('text', () => {
  it('csv', async () => {
    const pipeline = new oneai.Pipeline(
      oneai.skills.numbers(),
    );

    const input = {
      filePath: constants.csvPath,
      columns: ['input', 'timestamp', false, 'input_translated', false, 'metadata'],
      skipRows: 1,
      maxRows: 3,
    };
    const { outputs } = await pipeline.run(input, { multilingual: true });
    expect(outputs).to.have.lengthOf(1);
    expect(outputs[0]).to.have.property('text');
    expect(outputs[0]).to.have.property('numbers');
    expect(outputs[0].numbers).to.have.lengthOf(1);
    expect(outputs[0].numbers[0]).to.have.property('value');
  });

  it('pdf', async () => {
    const pipeline = new oneai.Pipeline(
      oneai.skills.pdfExtractText(),
    );

    const { pdfText } = await pipeline.run({ filePath: constants.pdfPath });
    console.log(pdfText);
  });
});
