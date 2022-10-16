import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import oneai from './testClient';
import constants from './constants.json';
import {
  APIKeyError, InputError, OneAIError, ServerError,
} from '../src/errors';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('errors', () => {
  const pipeline = new oneai.Pipeline(oneai.skills.anonymize());

  it('api key error', async () => {
    await expect(pipeline.run(constants.document, { apiKey: 'not an api key.' })).to.be.rejectedWith(APIKeyError);
  });
  it('input error', async () => {
    await expect(pipeline.run(constants.urlInput)).to.be.rejectedWith(InputError);
  });
  it('server error', async () => {
    await expect(pipeline.run('https://this-url-is-fake.fake')).to.be.rejectedWith(ServerError);
  });

  it('toJSON', async () => {
    expect(new OneAIError(10, 'hello').toJSON().statusCode).to.equal(10);
  });
});
