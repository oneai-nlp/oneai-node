/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
// https://drive.google.com/drive/u/0/folders/1L_apLy2bakDweL-PWcay807_rJdxQxyR
function parseSpeakerLine(line) {
  let text = line.trim();
  // capture opening timestamp - "[00:00]"", "1:10" ...
  const value = {
    weak: true,
    preTime: false,
    speaker: '',
    speaker_end: 0,
    time: false,
    timestamp: undefined,
    timestamp_full_match_string: undefined,
    separator: false,
    hasText: false,
    text: undefined,
  };

  /// /////////////////////////////////////////////////
  // extracting timestamp from text
  let matchArea = text.substring(0, Math.min(text.length, 40));
  let colonPos = matchArea.indexOf(':');
  let timestampFound = getTimestamp(matchArea, value);
  let signatureEndPos = 0;
  if (timestampFound) {
    // validate timestamp position
    // if (value.timestamp_position > 40) return false; // too far into the text
    if (colonPos !== -1 && colonPos < value.timestamp_position) {
      timestampFound = false;
      value.time = false;
      value.timestamp = undefined;
    } else {
      // check if pre/after
      if (value.timestamp_position === 0) { value.preTime = true; }

      // remove timestamp from text for further processing
      text = text.replace(value.timestamp_full_match_string, '');
      matchArea = matchArea.replace(value.timestamp_full_match_string, '');
      signatureEndPos = value.timestamp_full_match_string.length;
    }
  }

  /// /////////////////////////////////////////////////
  // check if speaker only, in all caps - WEAK PATTERN
  const match = (timestampFound)
    ? text.match(/^[ A-Za-z_-]{3,20}$/) // include lowercase
    : text.match(/^[ A-Z_-]{3,20}$/);

  if (match != null) {
    value.weak = !timestampFound;
    value.speaker = match[0].trim();
    // end position for speaker signature area (for highlighting),
    // use match[0].length to include whitespace
    value.speaker_end = match[0].length + signatureEndPos;
    value.hasText = false;
    return value;
  }

  // update colon position after timestamp removal
  if (timestampFound) colonPos = matchArea.indexOf(':');
  if (colonPos === -1 && !timestampFound) return null; // failed to fing signature

  if (colonPos === -1) { // only timestamp
    if (text.length !== 0) return null; // if text after timestamp, fail
    value.weak = true; // weak only if no timestamp is found
    value.speaker = 'Speaker';
    value.speaker_end = signatureEndPos;
    value.hasText = false;
  }

  value.separator = true;

  // if no whitespace after speaker, fail same line text
  const textPos = colonPos + 1;
  value.hasText = textPos < text.trimEnd().length - 1;
  if (value.hasText && ' \t\n\r\v'.indexOf(text[textPos]) === -1) { return null; }

  value.weak = false;
  value.text = value.hasText ? text.substring(textPos).trim() : null;
  value.speaker = text.substring(0, colonPos).trim();
  value.speaker_end = signatureEndPos + colonPos;
  return value;
}

function isEmptyOrWhitespace(_string1) {
  return (_string1 == null || _string1.length === 0 || !_string1.trim());
}

function comp(a, b) {
  return a.time === b.time && a.hasText === b.hasText
    && a.separator === b.separator && a.preTime === b.preTime;
}

function indexOfGroup(match, n) {
  let ix = match.index;
  for (let i = 1; i < n; i++) {
    if (match[i]) ix += match[i].length;
  }
  return ix;
}

function getTimestamp(text, value) {
  let match = null;

  // match preceding timestamp "[3:07 PM, 3/15/2022] Adam Hanft: Helps"
  match = text.match(/(^\s*\[?\s*)([0-9:,\sPAM/]{4,23})(\]?)\s*/);
  if (match != null && (match[3] || match[0].indexOf('/') !== -1)) { // match found + either  [ ] or /2/
    value.preTime = true;
    value.weak = false;
    value.time = true;
    value.timestamp = match[2].trim();
    value.timestamp_position = indexOfGroup(match, 2);
    value.timestamp_full_match_string = match[0];
    return true;
  }

  //                  optinal      [        timestamp                 ]  \s*
  match = text.match(/(^\s*)?(\[?)(\d{1,2}:\d{1,2})(:\d{1,2})?(\.\d*)?(\]?\s*)/);
  if (match != null) { // && match[0] != ":"
    value.weak = false;
    value.time = true;
    value.timestamp_position = match.index;
    value.timestamp_full_match_string = match[0];
    // capture timestamp without non-captured groups
    value.timestamp = text.substring(indexOfGroup(match, 3), indexOfGroup(match, 6)).trim();
    return true;
  }

  return false;
}

// version 1.6.1
// strict=true enforces the same speaker format pattern across all lines/
// struct=false only enforces that all lines HAVE a valid speaker pattern
export default function parseConversation(text, strict = false) {
  const result = [];

  // Trying to parse as SRT format
  const strRegex = /\d+\n\d{1,2}:\d{2}:\d{2}[,.]\d{1,3} --> \d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/;
  const match = text.match(strRegex);
  if (match != null) {
    const dataArray = text.split(strRegex);
    dataArray.shift(); // remove first empty line in array
    for (let i = 0; i < dataArray.length; i += 1) {
      result.push({
        speaker: 'Speaker',
        utterance: dataArray[i].trim().replace('\n', ' '),
      });
    }
    return result;
  }
  // return {"error":"SRT detected","line":0, "format":"SRT"};

  const lines = text.split(/\r?\n/);
  let firstLine = true;
  let structure = null;
  let currentLineInfo = null;
  let waitForTextLine = false;
  //   let weak = false;
  let previousObject = null;
  lines.forEach((line, i) => {
    // ignore empty prefix lines
    if (isEmptyOrWhitespace(line)) return;
    // parse first line to ascertain structure
    if (waitForTextLine) {
      previousObject.utterance = line.trim();
      // previousObject.text_line = i;
      waitForTextLine = false;
      return;
    }

    currentLineInfo = parseSpeakerLine(line);
    // if no speaker format detected, fail
    if (currentLineInfo == null) {
      if (firstLine) throw new Error('no_speaker_pattern', { line: i });
      previousObject.utterance += `\n${line.trim()}`;
      //   weak = true;
      return;
    }
    if (firstLine) structure = parseSpeakerLine(line);
    // weak |= currentLineInfo.weak;
    // parse new speaker line, if structure differs, fail parsing
    if (strict && !comp(structure, currentLineInfo)) {
      throw new Error('differing_pattern', { line: i });
    }
    firstLine = false;

    previousObject = {
      speaker: currentLineInfo.speaker,
      utterance: currentLineInfo.text || '',
      timestamp: currentLineInfo.timestamp,
      // speaker_line: i,
      // text_line: i,
      // speaker_length: currentLineInfo.speaker_end,
    };
    result.push(previousObject);
    waitForTextLine = !currentLineInfo.hasText;
  });
  if (previousObject != null && isEmptyOrWhitespace(previousObject.utterance)) {
    result.pop();
  }
  // if (waitForTextLine)  return {"error":"last_utterance_empty","line":i};
  // if any weak line detected
  // if (weak && result.length <=2) return {"error":"weak_pattern_not_long_enough","line":i};
  return result;
}
