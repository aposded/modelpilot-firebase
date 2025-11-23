# ModelPilot JavaScript/TypeScript Client

OpenAI-compatible JavaScript/TypeScript client for ModelPilot's intelligent AI model routing.

[![npm version](https://badge.fury.io/js/modelpilot-js.svg)](https://www.npmjs.com/package/modelpilot-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **OpenAI-Compatible API**: Drop-in replacement for OpenAI SDK
- **Intelligent Model Routing**: Automatic model selection based on cost, speed, and quality
- **Multi-Provider Support**: Access OpenAI, Anthropic, Google, and 100+ models
- **Cost Optimization**: Significant savings on AI costs through smart routing
- **Function Calling**: Full support for tools and function calling
- **Streaming Responses**: Real-time streaming with async iterators
- **TypeScript Support**: Full type definitions included
- **Rich Metadata**: Cost, latency, and model selection information

## Two Ways to Use ModelPilot

### Method 1: ModelPilot-JS SDK (Recommended)

```javascript
const ModelPilot = require('modelpilot-js');

const client = new ModelPilot({
  apiKey: 'mp_your_api_key',
  routerId: 'your_router_id'
});
```

### Method 2: OpenAI SDK with Modified BaseURL

```javascript
const { OpenAI } = require('openai');

const client = new OpenAI({
  apiKey: 'mp_your_api_key', // Use ModelPilot API key
  baseURL: 'https://modelpilot.co/api/router/your_router_id'
});
```

Both methods work identically - use whichever fits your project better!

## Installation

```bash
npm install modelpilot-js
# or
yarn add modelpilot-js
# or for OpenAI SDK method
npm install openai
```

## 🚀 Quick Start

```javascript
const ModelPilot = require('modelpilot-js');

const client = new ModelPilot({
  apiKey: process.env.MODELPILOT_API_KEY, // Get from https://modelpilot.co
  routerId: process.env.MODELPILOT_ROUTER_ID
});

const completion = await client.chat.create({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
  ],
  temperature: 0.7,
  max_tokens: 100,
});

console.log(completion.choices[0].message.content);

// Access ModelPilot metadata
console.log('Model used:', completion._meta?.modelUsed);
console.log('Cost:', completion._meta?.cost);
console.log('Latency:', completion._meta?.latency);
```

## 📚 Features

### Chat Completions

```javascript
// Basic completion
const completion = await client.chat.create({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing.' },
  ],
  max_tokens: 500,
  temperature: 0.7,
});

// Streaming
const stream = await client.chat.create({
  messages: [{ role: 'user', content: 'Write a story.' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Function Calling

```javascript
const completion = await mp.chat.create({
  messages: [{ role: 'user', content: "What's the weather in Tokyo?" }],
  functions: [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
        },
        required: ['location'],
      },
    },
  ],
  function_call: 'auto',
});

if (completion.choices[0].message.function_call) {
  const { name, arguments: args } = completion.choices[0].message.function_call;
  console.log(`Function called: ${name} with args: ${args}`);
}
```

### Tool Calling (Modern Function Calling)

```javascript
const completion = await mp.chat.create({
  messages: [{ role: 'user', content: 'Calculate 15 * 23' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'calculate',
        description: 'Perform mathematical calculations',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Math expression' },
          },
        },
      },
    },
  ],
  tool_choice: 'auto',
});
```

### Model Selection

```javascript
// Let ModelPilot choose the best model (recommended)
const smartCompletion = await mp.chat.create({
  messages: [{ role: 'user', content: 'Complex analysis task...' }],
  // ModelPilot automatically selects the optimal model
});

// Force a specific model
const specificCompletion = await mp.chat.create({
  model: 'openai:gpt-4o',
  messages: [{ role: 'user', content: 'Use GPT-4 specifically' }],
});

// Available models: openai:gpt-4o, openai:gpt-4o-mini, anthropic:claude-3-5-sonnet, etc.
```

## ⚙️ Configuration

### Client Options

```javascript
const mp = new ModelPilot({
  apiKey: 'your-api-key', // Required
  routerId: 'YOUR_ROUTER_ID', // Required
  timeout: 30000, // Optional: request timeout (ms)
  maxRetries: 3, // Optional: retry attempts
});
```

### Router Configuration

```javascript
// Get router information
const routerConfig = await mp.getRouterConfig();
console.log('Router mode:', routerConfig.mode);
console.log('Available features:', routerConfig.capabilities);

// Get available models
const models = await mp.getModels();
console.log(
  'Available models:',
  models.map((m) => m.id)
);
```

## 🔍 Advanced Features

### Response Metadata

ModelPilot provides rich metadata about each request:

```javascript
const completion = await mp.chat.create({
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log('Model used:', completion._meta.modelUsed);
console.log('Cost:', completion._meta.cost);
console.log('Latency:', completion._meta.latency + 'ms');
console.log('Router mode:', completion._meta.routerMode);
console.log('Selection confidence:', completion._meta.confidence);
```

### Error Handling

```javascript
try {
  const completion = await mp.chat.create({
    messages: [{ role: 'user', content: 'Hello!' }],
  });
} catch (error) {
  if (error instanceof ModelPilot.AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof ModelPilot.RateLimitError) {
    console.error('Rate limit exceeded');
  } else if (error instanceof ModelPilot.APIError) {
    console.error('API error:', error.message, error.status);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## 📖 TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import ModelPilot, {
  ChatCompletionCreateParams,
  ChatCompletionResponse,
} from 'modelpilot';

const mp = new ModelPilot({
  apiKey: process.env.MODELPILOT_API_KEY!,
});

const params: ChatCompletionCreateParams = {
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 100,
};

const completion: ChatCompletionResponse = await mp.chat.create(params);
```

## 🎯 Use Cases

### Cost Optimization

```javascript
// ModelPilot automatically routes to cost-effective models for simple tasks
const simple = await mp.chat.create({
  messages: [{ role: 'user', content: 'What is 2+2?' }],
  // Likely routes to a fast, cheap model like GPT-3.5
});

// And uses powerful models for complex tasks
const complex = await mp.chat.create({
  messages: [
    {
      role: 'user',
      content: 'Analyze this complex dataset and provide insights...',
    },
  ],
  // Likely routes to GPT-4 or Claude for better quality
});
```

### Performance Optimization

```javascript
// For latency-critical applications
const mp = new ModelPilot({
  apiKey: process.env.MODELPILOT_API_KEY,
  routerId: 'YOUR_ROUTER_ID',
});
```

### Multi-Modal Support

```javascript
const completion = await mp.chat.create({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What do you see in this image?' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image.jpg' },
        },
      ],
    },
  ],
});
```

## 🛠️ Examples

Check out the [examples directory](./examples/) for more usage examples:

- [Basic Usage](./examples/basic.js)
- [Migration Guide](./examples/migration-guide.js)
- [Advanced Features](./examples/advanced.js)
- [TypeScript Usage](./examples/typescript.ts)

## 📄 API Reference

### ModelPilot Class

#### Constructor

- `new ModelPilot(config: ModelPilotConfig)`

#### Methods

- `chat.create(params)` - Create chat completion
- `request(endpoint, options)` - Make custom API request
- `getRouterConfig()` - Get router configuration
- `getModels()` - Get available models

### Error Classes

- `ModelPilotError` - Base error class
- `APIError` - API-related errors
- `AuthenticationError` - Invalid API key
- `RateLimitError` - Rate limit exceeded
- `InvalidRequestError` - Malformed request

## 🤝 Support

- 📧 **Email**: help@modelpilot.co
- 📖 **Documentation**: https://docs.modelpilot.co
- 🐛 **Issues**: https://github.com/aposded/modelpilot-js/issues

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [ModelPilot Platform](https://modelpilot.co)
- [API Documentation](https://docs.modelpilot.co)
- [GitHub Repository](https://github.com/aposded/modelpilot-js)
- [npm Package](https://www.npmjs.com/package/modelpilot)
