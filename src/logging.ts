import { stderr, stdout } from 'process';

export class logger {
  static prefix = '\x1b[34m●\x1b[36m▲\x1b[35m▮\x1b[0m ';

  static debug(message: string) {
    stdout.write(logger.prefix + message);
  }

  static debugNoNewline(message: string) {
    stdout.clearLine(0);
    stdout.cursorTo(0);
    stdout.write(logger.prefix + message);
  }

  static error(message: string) {
    stderr.write(`${message}\n`);
  }
}

export function timeFormat(time: number) {
  const millies = Math.floor(time % 1000);
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${(minutes > 0) ? `${minutes}m ` : ''}${seconds % 60}s ${millies}ms`;
}
