// version 1.4.2
// strict=true enforces the same speaker format pattern across all lines/
// struct=false only enforces that all lines HAVE a valid speaker pattern
export function parseConversation(text, strict = false) {
    let result = [];
    let i = -1;

     // Trying to parse as SRT format
    let str_regex = /\d+\n\d{1,2}:\d{2}:\d{2}[,.]\d{1,3} --> \d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/;
    let match = text.match(str_regex);
    if (match != null) {
        let data_array = text.split(str_regex);
        data_array.shift(); // remove first empty line in array
        for (i = 0; i < data_array.length; i += 1) {
            result.push({
                speaker: "SPEAKER",
                utterance: data_array[i].trim().replace("\n"," ")
            });
        }
        return result;
    }
    //return {"error":"SRT detected","line":0, "format":"SRT"};

    let lines = text.split(/\r?\n/);
    let firstLine = true;
    let structure = null;
    let currentLineInfo = null;
    let waitForTextLine = false;
    let weak = false;
    let previousObject = null;
    i = -1;
    for (let line of lines) {
        ++i;
        // ignore empty prefix lines
        if (isEmptyOrWhitespace(line)) continue;
        // parse first line to ascertain structure
        if (waitForTextLine) {
            previousObject.utterance = line.trim();
            previousObject.text_line = i;
            waitForTextLine = false;
            continue;
        }

        currentLineInfo = parseSpeakerLine(line);
        // if no speaker format detected, fail
        if (currentLineInfo == null) {
            if (firstLine) throw { "error": "no_speaker_pattern", "line": i };
            previousObject.utterance += "\n" + line.trim();
            weak = true;
            continue;
        }
        if (firstLine) structure = parseSpeakerLine(line);
        weak |= currentLineInfo.weak;
        // parse new speaker line, if structure differs, fail parsing
        if (strict && !comp(structure, currentLineInfo)) {
            throw { "error": "differing_pattern", "line": i };
        }
        firstLine = false;

        previousObject = {
            speaker: currentLineInfo.speaker,
            utterance: currentLineInfo.text || "",
            speaker_line: i,
            text_line: i,
            speaker_length: currentLineInfo.speaker_end,
        };
        result.push(previousObject);
        waitForTextLine = !currentLineInfo.hasText;
    }
    if (previousObject != null && isEmptyOrWhitespace(previousObject.TEXT)) {
        result.pop();
    }
    //if (waitForTextLine)  return {"error":"last_utterance_empty","line":i};
    //if any weak line detected
    //if (weak && result.length <=2) return {"error":"weak_pattern_not_long_enough","line":i};
    return result;
}


function parseSpeakerLine(text) {
    // capture opening timestamp - "[00:00]"", "1:10" ...
    let value = {
        weak: true,
        preTime: false,
        speaker: '',
        speaker_end: 0,
        time: false,
        separator: false,
        hasText: false,
        text: null
    }

    let match = text.match(/^\s*\[?[0-9]+:[0-9]+\]?\s*/);
    if (match != null) {
        text = text.substring(match[0].length);
        value.preTime = true;
        value.weak = false;
    }
    // capture STRONG pattern - either timestamp or separator
    let matchArea = text.substring(0, Math.min(text.length, 35));
    match = matchArea.match(/\s{1,10}\[?[0-9]{1,2}:[0-9]{1,2}\]?\s*|\s{0,5}[:|-]/);

    if (match == null) // if STRONG NOT FOUND
    {
        // check if speaker only, in all caps - WEAK PATTERN
        match = matchArea.match(/^[A-Z_-]{3,20}$/);
        //console.log(matchArea);
        //console.log(match);
        if (match == null) return null; // not a valid format - FAIL
        value.weak = true;
        value.speaker = match[0];
        value.speaker_end = text.length;
        value.hasText = false;
    }
    else {
        value.weak = false;
        value.hasText = match.index + match[0].length < text.length;
        value.text = value.hasText ? text.substring(match.index + match[0].length).trim() : null;
        value.speaker = text.substring(0, match.index);
        value.speaker_end = match.index + match[0].length;
        // Check type of strong pattern
        // if only separator was found (only speaker, no timestamp)
        if (match[0].match(/[:|-]$/) != null) {
            value.separator = true;
        }
        else {
            text = text.substring(match.index + match[0].length);
            // look for another separator
            match = text.match(/^\s*[:|-]/);
            if (match != null) {
                value.separator = true;
                value.speaker_end = match.index + match[0].length;
                value.hasText = value.hasText && (match.index + match[0].length < text.length);
                value.text = value.hasText ? text.substring(match.index + match[0].length).trim() : null;
            }
            value.time = true;
        }
    }
    //text= text.substring(match[0].length);

    //console.log(match)
    return value;
}

function isEmptyOrWhitespace(_string1) {
    return (_string1 == null || _string1.length === 0 || !_string1.trim());
};
