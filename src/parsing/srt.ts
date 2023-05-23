/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */

import { Output } from '../model/pipeline';
import { OneAIError } from '../errors';

let srtFromJSON: any;

try {
  srtFromJSON = require('subtitle').stringifySync;
} catch (er) {
  srtFromJSON = undefined;
}

const patternWord = /\w+/;

export default function toSRT(
  output: Output,
  params?: {
    maxLengthWords?: number,
    maxLengthCharacters?: number,
  },
): string {
  if (srtFromJSON === undefined) {
    throw new OneAIError(422, '.srt conversion requires installing the `subtitle` npm package', 'install via `npm i subtitle`');
  } else if (output.transcription === undefined) {
    throw new OneAIError(422, 'pipeline output is missing a transcription field', 'run pipeline with the transcribe Skill & audio input');
  } else if (output.transcription.words === undefined || output.transcription.words.length === 0) {
    throw new OneAIError(422, 'pipeline output is missing a transcription.words field', 'run pipeline with the transcribe Skill & timestamp_per_word parameter set to true');
  } else if (output.transcription.sentences === undefined) {
    throw new OneAIError(422, 'pipeline output is missing a transcription.sentences field', 'run pipeline with sentences Skill after the transcribe Skill');
  }

  const nodes = output.transcription.sentences.map((sentence) => {
    const cues: any[] = [];

    const words = output.transcription!.words!
      .filter((word) => (
        word.timestamp! >= sentence.timestamp! && word.timestampEnd! <= sentence.timestampEnd!
      )).sort((a, b) => ((a.timestampEnd)! - (b.timestamp)!));

    let text = '';
    let wordCount = 0;
    let timestamp = words[0].timestamp!;
    let timestampEnd = 0;
    words.forEach((word) => {
      const isWord = patternWord.test(word.span_text);
      if (isWord && (
        (params?.maxLengthWords && wordCount >= params?.maxLengthWords)
        || (params?.maxLengthCharacters && text.length >= params?.maxLengthCharacters)
      )) {
        cues.push({
          type: 'cue',
          data: {
            start: timestamp,
            end: timestampEnd,
            text: text.trim(),
          },
        });
        text = '';
        wordCount = 0;
        timestamp = word.timestamp!;
      }
      if (isWord) {
        text += ' ';
        wordCount++;
      }
      text += word.span_text;
      timestampEnd = word.timestampEnd!;
    });
    if (text.length > 0) {
      cues.push({
        type: 'cue',
        data: {
          start: timestamp,
          end: sentence.timestampEnd,
          text: text.trim(),
        },
      });
    }

    return cues;
  }).flat();

  return srtFromJSON(nodes, { format: 'SRT' });
}
