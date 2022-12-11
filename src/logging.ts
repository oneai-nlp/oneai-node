import * as readline from 'readline';

const { stderr, stdout } = process;

export default class Logger {
  enabled: boolean;

  prefix = '\x1b[34m●\x1b[36m▲\x1b[35m▮\x1b[0m ';

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  debug(message: string) {
    if (this.enabled) stdout.write(this.prefix + message);
  }

  debugNoNewline(message: string) {
    if (this.enabled) {
      readline.clearLine(stdout, 0);
      readline.cursorTo(stdout, 0);
      stdout.write(this.prefix + message);
    }
  }

  error(message: string) {
    if (this.enabled) stderr.write(`${message}\n`);
  }
}

export function timeFormat(time: number) {
  const millies = Math.floor(time % 1000);
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${(minutes > 0) ? `${minutes}m ` : ''}${seconds % 60}s ${millies}ms`;
}
