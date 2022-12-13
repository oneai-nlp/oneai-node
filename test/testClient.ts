import { expect } from 'chai';
import * as dotenv from 'dotenv';
import { OneAI } from '../src/index';

describe('client', () => {
  it('init', () => {
    expect(() => new OneAI().toString()).to.not.throw();
    expect(() => new OneAI('test').toString()).to.not.throw();
  });
});

dotenv.config();
export default new OneAI(process.env.API_KEY);
