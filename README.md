<p align="center">
  <a href="https://customer.io">
    <img src="https://studio.oneai.com/static/media/logo-gray.d978e495.svg" height="60">
  </a>
  <p align="center">NLP-as-a-service</p>
</p>

# One AI Node.js SDK
OneAI is a NLP as a service platform. Our API enables language comprehension in context, transforming texts from any source into structured data to use in code.

This SDK provides safe and convenient access to OneAI's API from a node.js environment.

## Documentation
See the [One AI documentation](https://studio.oneai.com/docs?utm_source=open_source&utm_medium=node_sdk_readme)

## Getting started

### Installation
`npm install oneai`

### Authentication
You will need a valid API key for all requests. Register and create a key for your project [in OneAI Studio](https://studio.oneai.com/?utm_source=open_source&utm_medium=node_sdk_readme). As a security measure we only show the key once, so make sure to keep it somewhere safe.

#### Example
```node
import oneai from 'oneai';
oneai.api_key = '<YOUR-API-KEY>';

const pipeline = new oneai.Pipeline(
    oneai.skills.entities(),
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
    oneai.skills.entities(),
    oneai.skills.summarize({ min_length: 20 }),
    oneai.skills.entities(),
);
const output = await pipeline.run(text);
console.log(output);
```

In plain English, we extract entities from the text, then summarize it, and then extract entities from the summary. Here's what the reponse would look like (the important thing to notice, whenever a generator skill runs, `summarize` in this case, all following skills responses will be embedded within the generator result as it changes the text the skill processes:

```json
{
   "text":"The Hitchhiker's Guide to the Galaxy is a science fiction comedy radio series written by Douglas Adams ",
   "entities":[ // This array will contain the entities extracted from the original text
      {
         "type":"entity",
         "skill":"entities",
         "name":"WORK_OF_ART",
         "span":[
            0,
            36
         ],
         "value":"The Hitchhiker's Guide to the Galaxy",
         "output_spans":[
            {
               "section":0,
               "start":0,
               "end":36
            }
         ],
         "input_spans":null,
         "span_text":"The Hitchhiker's Guide to the Galaxy",
         "data":null
      },
      {
         "type":"entity",
         "skill":"entities",
         "name":"PERSON",
         "span":[
            89,
            102
         ],
         "value":"Douglas Adams",
         "output_spans":[
            {
               "section":0,
               "start":89,
               "end":102
            }
         ],
         "input_spans":null,
         "span_text":"Douglas Adams",
         "data":null
      }
   ],
   "summary":{ // this will contain the summary itself...
      "text":"The Hitchhiker's Guide to the Galaxy is a science fiction comedy",
      "origins":[
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               0,
               3
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":0,
                  "end":3
               }
            ],
            "input_spans":null,
            "span_text":"The",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               0,
               3
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":0,
                  "end":3
               }
            ],
            "input_spans":null,
            "span_text":"The",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               10,
               14
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":10,
                  "end":14
               }
            ],
            "input_spans":null,
            "span_text":"iker",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               14,
               16
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":14,
                  "end":16
               }
            ],
            "input_spans":null,
            "span_text":"'s",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               16,
               22
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":16,
                  "end":22
               }
            ],
            "input_spans":null,
            "span_text":" Guide",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               16,
               22
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":16,
                  "end":22
               }
            ],
            "input_spans":null,
            "span_text":" Guide",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               22,
               25
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":22,
                  "end":25
               }
            ],
            "input_spans":null,
            "span_text":" to",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               25,
               29
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":25,
                  "end":29
               }
            ],
            "input_spans":null,
            "span_text":" the",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               29,
               36
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":29,
                  "end":36
               }
            ],
            "input_spans":null,
            "span_text":" Galaxy",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               29,
               36
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":29,
                  "end":36
               }
            ],
            "input_spans":null,
            "span_text":" Galaxy",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               29,
               36
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":29,
                  "end":36
               }
            ],
            "input_spans":null,
            "span_text":" Galaxy",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               39,
               41
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":39,
                  "end":41
               }
            ],
            "input_spans":null,
            "span_text":" a",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               39,
               41
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":39,
                  "end":41
               }
            ],
            "input_spans":null,
            "span_text":" a",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               41,
               49
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":41,
                  "end":49
               }
            ],
            "input_spans":null,
            "span_text":" science",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               41,
               49
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":41,
                  "end":49
               }
            ],
            "input_spans":null,
            "span_text":" science",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               49,
               57
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":49,
                  "end":57
               }
            ],
            "input_spans":null,
            "span_text":" fiction",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               49,
               57
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":49,
                  "end":57
               }
            ],
            "input_spans":null,
            "span_text":" fiction",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               57,
               64
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":57,
                  "end":64
               }
            ],
            "input_spans":null,
            "span_text":" comedy",
            "data":null
         },
         {
            "type":"origin",
            "skill":"origin",
            "name":null,
            "span":[
               57,
               64
            ],
            "value":null,
            "output_spans":[
               {
                  "section":0,
                  "start":57,
                  "end":64
               }
            ],
            "input_spans":null,
            "span_text":" comedy",
            "data":null
         }
      ],
      "entities":[ // ...and the entities generated from the summary
         {
            "type":"entity",
            "skill":"entities",
            "name":"WORK_OF_ART",
            "span":[
               0,
               36
            ],
            "value":"The Hitchhiker's Guide to the Galaxy",
            "output_spans":[
               {
                  "section":0,
                  "start":0,
                  "end":36
               }
            ],
            "input_spans":null,
            "span_text":"The Hitchhiker's Guide to the Galaxy",
            "data":null
         }
      ]
   }
}
```
### Support

Feel free to submit issues in this repo, contact us at devrel@oneai.com, or chat with us on [Disocrd](https://discord.gg/ArpMha9n8H)
