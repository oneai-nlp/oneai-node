[![Logo](./oneai_logo_light_cropped.svg)](https://oneai.com?utm_source=open_source&utm_medium=node_sdk_readme)

# Natural Language Processing API
[![API Key](https://img.shields.io/badge/%20-Get%20Your%20API%20Key%20for%20Free-%231d1c29?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMTEyIiBoZWlnaHQ9Ijg4IiB2aWV3Qm94PSIwIDAgMTEyIDg4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTY5LjI5MTMgMzcuNTU4NkwzNi4xMTQzIDg3Ljc1MTZIMTAyLjQ2OEw2OS4yOTEzIDM3LjU1ODZaIiBmaWxsPSIjMDBGRkZGIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNODkuMzAwOCA1MC4yOTIxSDExMS4xNjRWMEg4OS4zMDA4VjUwLjI5MjFaIiBmaWxsPSIjRjIzREU5Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjUuOTEwOCAxMS42NDc5QzExLjYwMDcgMTEuNjQ3OSAwIDIzLjI0ODYgMCAzNy41NTg3QzAgNTEuODY4OCAxMS42MDA3IDYzLjQ3MDEgMjUuOTEwOCA2My40NzAxQzQwLjIyMDkgNjMuNDcwMSA1MS44MjE2IDUxLjg2ODggNTEuODIxNiAzNy41NTg3QzUxLjgyMTYgMjMuMjQ4NiA0MC4yMjA5IDExLjY0NzkgMjUuOTEwOCAxMS42NDc5IiBmaWxsPSIjNEQ0REZGIi8+Cjwvc3ZnPgo=)](https://studio.oneai.com/settings/api-keys)
[![Version](https://img.shields.io/npm/v/oneai.svg)](https://www.npmjs.org/package/oneai)
[![Downloads](https://img.shields.io/npm/dm/oneai.svg)](https://www.npmjs.com/package/oneai)
[![License](https://img.shields.io/npm/l/oneai.svg)](https://www.npmjs.com/package/oneai)
[![Try on RunKit](https://badge.runkitcdn.com/oneai.svg)](https://runkit.com/npm/oneai)
[![Discord](https://img.shields.io/discord/941458663493746698?logo=Discord)](https://discord.gg/ArpMha9n8H)


One AI provides natural language processing for Node.js. Some use cases include: 

- Summarize conversations and articles
- Detect sentiments and emotions
- Detect topics and classify content

![Alt text](https://s4.gifyu.com/images/Screen-Recording-10-6-2022-at-6.55-PM.gif "Summarize")

Example of summarizing a Zoom meeting:
```node
const conversation = new oneai.Conversation(
   boringMeeting
);

const pipeline = new oneai.Pipeline(
   oneai.skills.transcribe(),
   oneai.skills.summarize(),
);

pipeline.run(conversation);

// Output: Luigi and Mario agreed to fix the plumbing at 9am on Friday.
```


See the full documentation [here.](https://studio.oneai.com/docs?utm_source=open_source&utm_medium=node_sdk_readme)

## Getting started

### Installation
`npm install oneai`

### Authentication
You will need a valid API key for all requests. Register and create a key for your project [in One AI Studio](https://studio.oneai.com/?utm_source=open_source&utm_medium=node_sdk_readme). As a security measure we only show the key once, so make sure to keep it somewhere safe.

#### Example
```node
import OneAI from 'oneai';

oneai = new OneAI('<YOUR-API-KEY>');

const pipeline = new oneai.Pipeline(
    oneai.skills.names(),
    oneai.skills.summarize({ min_length: 20 }),
    oneai.skills.highlights()
);
const output = await pipeline.run('analyze this text');
console.log(output);
```

## Pipeline API

The pipeline API enables analyzing and transforming text using various skills. A skill is a package of trained NLP models, available via API, which accept text from various language sources as input and respond with processed texts and extracted metadata. Chaining skills together creates a pipeline.

### OneAI Studio

The best way to create a pipeline is to use our [studio](https://studio.oneai.com/?utm_source=open_source&utm_medium=node_sdk_readme) where you can craft a pipeline using an easy graphical interface and then paste the generated code back into your repository. 

### Basic Example

Let's say you're interested in extracting keywords from the text.
```node
const pipeline = new oneai.Pipeline(
    oneai.skills.keywords(),
);
const output = await pipeline.run('analyze this text');
console.log(output);
```

### Multi Skills request

Let's say you're interested in extracting keywords *and* emotions from the text.
```node
const pipeline = new oneai.Pipeline(
    oneai.skills.keywords(),
    oneai.skills.emotions(),
);
const output = await pipeline.run('analyze this text');
console.log(output);
```

### Analyzer Skills vs Generator Skills

Skills can do either text analysis, and then their output are labels and spans (labels location in the analyzed text), or they can be generator skills, in which case they transform the input text into an output text.

Here's an example for a pipeline that combines both type of skills. It will extract keywords and emotions from the text, and then summarize it.

```node
const pipeline = new oneai.Pipeline(
    oneai.skills.keywords(),
    oneai.skills.emotions(),
    oneai.skills.summarize(),
);
const output = await pipeline.run('analyze this text');
console.log(output);
```

### Order is Important

When the pipeline is invoked, it is invoked with an original text you submit. If a generator skill is ran, then all following skills will use its generated text rather then the original text. In this example, for instance, we change the order of the pipeline from the previous example, and the results will be different. Instead of extracting keywords and emotions from the original text, keywords and emotions will be extracted from the generated summary.

```node
const pipeline = new oneai.Pipeline(
    oneai.skills.summarize(),
    oneai.skills.keywords(),
    oneai.skills.emotions(),
);
const output = await pipeline.run('analyze this text');
console.log(output);
```

### Configuring Skills
Many skills are configurable as you can find out in the [docs](https://studio.oneai.com/docs?utm_source=open_source&utm_medium=node_sdk_readme). Let's use the exact same example, this time however, we'll limit the summary length to 50 words.
```node
const pipeline = new oneai.Pipeline(
    oneai.skills.summarize({max_length: 50}),
    oneai.skills.keywords(),
    oneai.skills.emotions(),
);
const output = await pipeline.run('analyze this text');
console.log(output);
```

### Output
The structure of the output is dynamic, and corresponds to the Skills used, whether they are generators or analyzers, and their order in the pipeline. Each output object contains the input text (which can be the original input or text produced by generator Skills), and a list of labels detected by analyzer Skills, that contain the extracted data.

Let's say we run this code
```node
const text = "The Hitchhiker's Guide to the Galaxy is a science fiction comedy radio series written by Douglas Adams ";
const pipeline = new oneai.Pipeline(
    oneai.skills.names(),
    oneai.skills.summarize({ min_length: 20 }),
    oneai.skills.names(),
);
const output = await pipeline.run(text);
console.log(output);
```

In plain English, we extract names from the text, then summarize it, and then extract names from the summary. Here's what the reponse would look like (the important thing to notice, whenever a generator skill runs, `summarize` in this case, all following skills responses will be embedded within the generator result as it changes the text the skill processes:

```json
{
   "text":"The Hitchhiker's Guide to the Galaxy is a science fiction comedy radio series written by Douglas Adams ",
   "names":[ // This array will contain the names detected in the original text
      {
         "type":"name", // label type
         "name":"WORK_OF_ART", // label class
         "value":"The Hitchhiker's Guide to the Galaxy", // label value
         "output_spans":[ // label spans (where the name was detected in the text)
            {
               "section":0,
               "start":0,
               "end":36
            }
         ],
      },
      ...
   ],
   "summary":{
      // this actual summary
      "text":"The Hitchhiker's Guide to the Galaxy is a science fiction comedy",
      // the names detected in the summary
      "names":[
         {
            "type":"name",
            "name":"WORK_OF_ART",
            "value":"The Hitchhiker's Guide to the Galaxy",
            "output_spans":[
               {
                  "section":0,
                  "start":0,
                  "end":36
               }
            ],
         },
         ...
      ]
   }
}
```

### File Uploads
Our API supports the following file extensions:
* `.txt`- text content
* `.json`- conversations in the One AI conversation format
* `.srt`- analyze captions as conversations
* `.wav`, `.mp3`- audio files to be transcribed & analyzed
* `.jpg`- detect text in pictures via OCR
Upload a file via the `Pipeline.runFile` method, i.e
```node
const filePath = './example.txt';
const pipeline = new oneai.Pipeline(...);
const output = await pipeline.runFile(filePath);
```

### Support

Feel free to submit issues in this repo, contact us at devrel@oneai.com, or chat with us on [Discord](https://discord.gg/ArpMha9n8H)
