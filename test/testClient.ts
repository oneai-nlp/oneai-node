import * as dotenv from 'dotenv';
import OneAI from '../src/index';

dotenv.config();
export default new OneAI(process.env.API_KEY);
