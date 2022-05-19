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
The structure of the output is dynamic, and corresponds to the Skills used and their order in the pipeline. Each output object contains the input text (which can be the original input or text produced by generator Skills), and a list of labels detected by analyzer Skills, that contain the extracted data.
```node
const pipeline = new oneai.Pipeline(
    oneai.skills.summarize(),
    oneai.skills.keywords(),
    oneai.skills.emotions(),
);
const output = await pipeline.run('analyze this text');

console.log(output.entities);
console.log(output.emotions);
console.log(output.summary.text);
console.log(output.summary.highlights);
```

### Support

Feel free to submit issues in this repo or chat with us on [Disocrd](https://discord.gg/ArpMha9n8H)
