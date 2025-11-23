# Example Setup Guide

This guide provides code examples to help you get started with the ModelPilot Firebase Extension.

## Important: onCall Function Usage

This extension provides a **callable Cloud Function**, not a Firestore trigger. You call it directly from your app code to process prompts and get instant AI responses.

## Initial Setup Scripts

### 1. Create Sample Prompt Templates

```javascript
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function createSamplePrompts() {
  const prompts = [
    {
      id: 'welcome-email',
      template:
        'Write a friendly welcome email for {{userName}} who just signed up for {{productName}}. Make it warm and professional.',
      maxTokens: 500,
      temperature: 0.7,
      description: 'Welcome email template',
    },
    {
      id: 'product-description',
      template:
        'Create an engaging product description for {{productName}}. Price: ${{price}}. Key features: {{#each features}}- {{this}}\n{{/each}}',
      maxTokens: 300,
      temperature: 0.8,
      description: 'Product description generator',
    },
    {
      id: 'support-response',
      template:
        'Customer {{customerName}} ({{customerTier}} tier) has the following issue: {{issue}}\n\nProvide a helpful, empathetic support response.',
      maxTokens: 400,
      temperature: 0.6,
      description: 'Customer support response template',
    },
    {
      id: 'blog-intro',
      template:
        'Write an engaging blog post introduction about {{topic}}. Target audience: {{audience}}. Tone: {{tone}}.',
      maxTokens: 250,
      temperature: 0.9,
      description: 'Blog post introduction',
    },
  ];

  for (const prompt of prompts) {
    const { id, ...data } = prompt;
    await db.collection('prompts').doc(id).set(data);
    console.log(`Created prompt template: ${id}`);
  }

  console.log('✅ Sample prompts created successfully!');
}

createSamplePrompts();
```

### 2. Test the Extension (Node.js)

```javascript
const { initializeApp } = require('firebase-admin/app');
const { getFunctions } = require('firebase-admin/functions');

initializeApp();

async function testExtension() {
  try {
    console.log('Calling extension...');

    const functions = getFunctions();
    const processPrompt = functions.httpsCallable(
      'ext-firestore-modelpilot-prompts-processPrompt'
    );

    const result = await processPrompt({
      promptId: 'welcome-email',
      context: {
        userName: 'John Doe',
        productName: 'ModelPilot Platform',
      },
      maxTokens: 300,
    });

    console.log('\n✅ Success!');
    console.log('Response:', result.data.response);
    console.log('Model used:', result.data.metadata.model);
    console.log('Cost:', `$${result.data.metadata.modelPilot.cost}`);
    console.log('Latency:', `${result.data.metadata.modelPilot.latency}ms`);
    console.log('Tokens:', result.data.metadata.usage.total_tokens);
  } catch (error) {
    console.log('\n❌ Failed!');
    console.log('Error:', error.message);
  }
}

testExtension();
```

### 3. Batch Processing Example

```javascript
const { initializeApp } = require('firebase-admin/app');
const { getFunctions } = require('firebase-admin/functions');

initializeApp();

async function batchProcess() {
  const users = [
    { name: 'Alice Johnson', email: 'alice@example.com' },
    { name: 'Bob Smith', email: 'bob@example.com' },
    { name: 'Carol Williams', email: 'carol@example.com' },
  ];

  const functions = getFunctions();
  const processPrompt = functions.httpsCallable(
    'ext-firestore-modelpilot-prompts-processPrompt'
  );

  console.log(`Processing ${users.length} prompts...`);
  const promises = users.map((user) =>
    processPrompt({
      promptId: 'welcome-email',
      context: {
        userName: user.name,
        userEmail: user.email,
        productName: 'Amazing SaaS',
      },
    })
  );

  const results = await Promise.allSettled(promises);

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  const totalCost = results
    .filter((r) => r.status === 'fulfilled')
    .reduce((sum, r) => sum + r.value.data.metadata.modelPilot.cost, 0);

  console.log('\n✅ Batch complete!');
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
}

batchProcess();
```

### 4. Track Usage and Costs

```javascript
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getFunctions } = require('firebase-admin/functions');

initializeApp();
const db = getFirestore();

async function processWithTracking(promptId, context) {
  const functions = getFunctions();
  const processPrompt = functions.httpsCallable(
    'ext-firestore-modelpilot-prompts-processPrompt'
  );

  const result = await processPrompt({ promptId, context });

  // Store usage data for analytics
  await db.collection('ai_usage_logs').add({
    timestamp: new Date(),
    promptId,
    model: result.data.metadata.model,
    tokens: result.data.metadata.usage.total_tokens,
    cost: result.data.metadata.modelPilot.cost,
    latency: result.data.metadata.modelPilot.latency,
    provider: result.data.metadata.modelPilot.provider,
  });

  console.log(
    `Request logged - Cost: $${result.data.metadata.modelPilot.cost}`
  );
  return result.data;
}

// Example usage
processWithTracking('welcome-email', {
  userName: 'John Doe',
  productName: 'MyApp',
});
```

## Client-Side Usage (Web/Mobile)

### React Example

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

function AIPromptComponent() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateContent = async (promptId, context) => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const processPrompt = httpsCallable(
        functions,
        'ext-firestore-modelpilot-prompts-processPrompt'
      );

      const result = await processPrompt({ promptId, context });
      setResponse(result.data.response);

      // Optionally track cost
      console.log('Cost:', result.data.metadata.modelPilot.cost);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() =>
          generateContent('welcome-email', {
            userName: 'John',
            productName: 'MyApp',
          })
        }
        disabled={loading}>
        {loading ? 'Generating...' : 'Generate Welcome Email'}
      </button>

      {error && <div className="error">{error}</div>}
      {response && <div className="response">{response}</div>}
    </div>
  );
}
```

### Cloud Functions Integration

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Trigger AI processing when user signs up
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const processPrompt = admin
    .getFunctions()
    .httpsCallable('ext-firestore-modelpilot-prompts-processPrompt');

  try {
    const result = await processPrompt({
      promptId: 'welcome-email',
      context: {
        userName: user.displayName || 'there',
        userEmail: user.email,
        productName: 'Our Platform',
      },
    });

    console.log('Welcome email generated:', result.data.response);

    // Send via your email service
    // await sendEmail(user.email, 'Welcome!', result.data.response);
  } catch (error) {
    console.error('Failed to generate welcome email:', error);
  }
});

// Custom endpoint that uses the extension
exports.generateBlogPost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in'
    );
  }

  const processPrompt = admin
    .getFunctions()
    .httpsCallable('ext-firestore-modelpilot-prompts-processPrompt');

  const result = await processPrompt({
    promptId: 'blog-intro',
    context: {
      topic: data.topic,
      audience: data.audience,
    },
    maxTokens: 500,
  });

  return {
    content: result.data.response,
    cost: result.data.metadata.modelPilot.cost,
  };
});
```

## Advanced Handlebars Examples

### Conditional Content

```javascript
// Prompt template
{
  template: `
    {{#if isPremium}}
    Dear Premium Member {{userName}},

    Thank you for your continued support! Here are your exclusive benefits:
    {{#each premiumFeatures}}
    - {{this}}
    {{/each}}
    {{else}}
    Hi {{userName}},

    Upgrade to premium to unlock exclusive features!
    {{/if}}
  `
}

// Usage
{
  promptId: 'user-message',
  context: {
    userName: 'Alice',
    isPremium: true,
    premiumFeatures: ['Priority support', 'Advanced analytics', 'Custom branding']
  }
}
```

### Complex Data Structures

```javascript
// Prompt template
{
  template: `
    Order Summary for {{customer.name}}:

    Items:
    {{#each order.items}}
    - {{this.name}} (x{{this.quantity}}): ${{this.price}}
    {{/each}}

    Shipping to:
    {{customer.address.street}}
    {{customer.address.city}}, {{customer.address.state}} {{customer.address.zip}}

    Total: ${{order.total}}
  `
}

// Usage
{
  promptId: 'order-confirmation',
  context: {
    customer: {
      name: 'John Doe',
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102'
      }
    },
    order: {
      items: [
        { name: 'Widget', quantity: 2, price: 29.99 },
        { name: 'Gadget', quantity: 1, price: 49.99 }
      ],
      total: 109.97
    }
  }
}
```

## Security Rules Examples

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Prompts collection - read-only for authenticated users
    match /prompts/{promptId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // AI requests - users can only create and read their own
    match /ai_requests/{requestId} {
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow read, update: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow delete: if false; // Prevent deletion for audit trail
    }
  }
}
```

Remember to add `userId` field when creating requests if using user-specific security rules!
