require('dotenv').config();
const { OneAI } = require('../lib/src/index');

module.exports = new OneAI(process.env.API_KEY);
