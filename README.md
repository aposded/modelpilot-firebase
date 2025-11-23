# Process Prompts with ModelPilot

**Author**: ModelPilot Team  
**Description**: Processes Firestore documents with AI prompts using ModelPilot intelligent routing, with support for Handlebars templates for dynamic personalization.

---

## 🚀 Overview

This Firebase extension provides a callable Cloud Function to process AI prompts using ModelPilot's intelligent model routing system. It supports dynamic content personalization using Handlebars templates for building powerful AI-powered features in your app.

## ✨ Features

- **Callable Function**: Direct function calls from your app code
- **Intelligent Model Routing**: Automatically selects the best AI model for your needs
- **Cost Optimization**: Save up to 70% on AI costs through smart routing
- **Handlebars Templates**: Use dynamic templates with user data
- **Automatic Retries**: Built-in fallback handling for reliability
- **Detailed Metadata**: Track costs, latency, and model selection
- **Instant Response**: Get AI response directly in function return value

## 📋 How It Works

1. **Create a prompt template** in your prompts collection with Handlebars syntax
2. **Call the function** from your app with `promptId` and optional `context` data
3. **Extension automatically**:
   - Fetches the prompt template
   - Renders it with your context data
   - Calls ModelPilot API
   - Returns the response directly to your app

## 📝 Example Usage

### 1. Create a Prompt Template

```javascript
// Document in 'prompts' collection
{
  id: "welcome-email",
  template: "Write a friendly welcome email for {{userName}} who just signed up for {{productName}}. Their email is {{userEmail}}.",
  maxTokens: 500,
  temperature: 0.7
}
```

### 2. Call the Function

```javascript
// From your web or mobile app
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processPrompt = httpsCallable(
  functions,
  'ext-firestore-modelpilot-prompts-processPrompt'
);

const result = await processPrompt({
  promptId: 'welcome-email',
  context: {
    userName: 'John Doe',
    userEmail: 'john@example.com',
    productName: 'Amazing App',
  },
});

console.log(result.data);
```

### 3. Get the Response

```javascript
// Function returns immediately with:
{
  success: true,
  response: "Dear John Doe,\n\nWelcome to Amazing App! ...",
  metadata: {
    model: "gpt-4o-mini",
    usage: { total_tokens: 245, ... },
    timestamp: "2024-01-15T10:30:00.000Z",
    modelPilot: {
      cost: 0.0012,
      latency: 850,
      provider: "openai"
    }
  }
}
```

## 🛠️ Configuration

### Extension Parameters

- **MODELPILOT_API_KEY**: Your ModelPilot API key (from [dashboard](https://modelpilot.co/dashboard))
- **MODELPILOT_ROUTER_ID**: Router ID for model selection
- **PROMPTS_COLLECTION**: Collection containing prompt templates (default: `prompts`)
- **LOCATION**: Cloud Functions deployment region

### Function Call Parameters

When calling the function, you can pass:

- **promptId** (required): ID of the prompt template document
- **context** (optional): Object with data for Handlebars template
- **maxTokens** (optional): Override template's max_tokens setting
- **temperature** (optional): Override template's temperature (0-1)
- **topP** (optional): Override template's top_p (0-1)

### Response Format

The function returns an object with:

- **success**: Boolean indicating if request succeeded
- **response**: The AI-generated text
- **metadata**: Object containing model, usage, timestamp, and ModelPilot metrics (cost, latency, provider)

## 📚 Handlebars Template Guide

### Basic Variables

```handlebars
Hello {{name}}! Your order #{{orderId}} is ready.
```

### Conditionals

```handlebars
{{#if isPremium}}
  Thank you for being a premium member!
{{else}}
  Upgrade to premium for more features.
{{/if}}
```

### Loops

```handlebars
Your items:
{{#each items}}
  - {{this.name}}: ${{this.price}}
{{/each}}
```

### Nested Data

```handlebars
Shipping to: {{address.street}}, {{address.city}}
```

## 💰 Pricing

This extension uses:

- **Firestore**: Standard Firestore pricing applies
- **Cloud Functions**: Standard Cloud Functions pricing applies
- **ModelPilot API**: Pay-as-you-go pricing based on usage
  - Detailed cost tracking in metadata
  - Typically 40-70% cheaper than direct OpenAI/Anthropic

## 🔒 Security

- API keys are securely stored as secrets
- Firestore security rules apply to all collections
- Ensure proper access controls on your collections

## 📖 Learn More

- [ModelPilot Documentation](https://docs.modelpilot.co)
- [Handlebars Guide](https://handlebarsjs.com/guide/)
- [Firebase Extensions](https://firebase.google.com/docs/extensions)

## 🤝 Support

- [ModelPilot Support](https://modelpilot.co/support)
- [GitHub Issues](https://github.com/aposded/modelpilot-firebase-extension/issues)
- [Community Discord](https://discord.gg/modelpilot)

## 📄 License

Apache-2.0
