import { expect } from 'chai';
import * as dotenv from 'dotenv';
import OneAI1, { OneAI as OneAI2 } from '../src/index';

const { OneAI } = require('../src/index');

describe('client', () => {
  it('init', () => {
    expect(() => new OneAI().toString()).to.not.throw();
    expect(() => new OneAI('test').toString()).to.not.throw();
    expect(() => new OneAI1().toString()).to.not.throw();
    expect(() => new OneAI1('test').toString()).to.not.throw();
    expect(() => new OneAI2().toString()).to.not.throw();
    expect(() => new OneAI2('test').toString()).to.not.throw();
  });
});

dotenv.config();
export default new OneAI(process.env.API_KEY);
