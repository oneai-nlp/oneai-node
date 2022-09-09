import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { version } from '../../package.json';

export const uuid = (() => {
  const filePath = `${__dirname}/.uuid`;
  let result = '';
  if (fs.existsSync(filePath)) {
    result = fs.readFileSync(filePath, 'utf8');
  } else {
    result = uuidv4().replace(/-/g, '');
    fs.writeFileSync(filePath, result);
  }
  return result;
})();

export const agent = `node-sdk/${version}/${uuid}`;
