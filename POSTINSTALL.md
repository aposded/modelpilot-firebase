# See it in action

You can test out this extension right away!

### Quick Start

1. **Create a prompt template** in your prompts collection:

```javascript
// Add a document to 'prompts' collection via Firebase Console or code
{
  template: "Generate a product description for {{productName}}. It costs ${{price}} and has these features: {{#each features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}",
  maxTokens: 300,
  temperature: 0.7
}
```

2. **Call the extension** from your app code:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processPrompt = httpsCallable(
  functions,
  'ext-firestore-modelpilot-prompts-processPrompt'
);

try {
  const result = await processPrompt({
    promptId: 'YOUR_PROMPT_DOCUMENT_ID',
    context: {
      productName: 'Smart Watch Pro',
      price: 299,
      features: ['Heart rate monitoring', 'GPS tracking', 'Water resistant'],
    },
  });

  console.log('AI Response:', result.data.response);
  console.log('Cost:', result.data.metadata.modelPilot.cost);
  console.log('Model:', result.data.metadata.model);
} catch (error) {
  console.error('Error:', error.message);
}
```

3. **Get instant results!** The function returns immediately with:
   - `response`: The AI-generated content
   - `metadata`: Model used, tokens, cost, latency

### Using the extension

**Function Parameters**

When calling the function, pass an object with:

**Required:**

- `promptId` (string): ID of the prompt template document in your prompts collection

**Optional:**

- `context` (object): Data to populate Handlebars template variables
- `maxTokens` (number): Override template's max_tokens (e.g., 500)
- `temperature` (number): Override template's temperature, 0-1 (e.g., 0.7)
- `topP` (number): Override template's top_p, 0-1 (e.g., 0.9)

**Prompt Template Structure**

Create documents in your prompts collection with:

**Required:**

- `template` (string): Handlebars template with your prompt

**Optional:**

- `maxTokens` (number): Maximum tokens in response (default: model default)
- `temperature` (number): Creativity level 0-1 (default: 0.7)
- `topP` (number): Nucleus sampling 0-1 (default: 1)

**Response Structure**

The function returns an object with:

```javascript
{
  success: true,
  response: "The AI-generated text...",
  metadata: {
    model: "gpt-4o-mini",
    usage: {
      prompt_tokens: 45,
      completion_tokens: 123,
      total_tokens: 168
    },
    finishReason: "stop",
    timestamp: "2024-01-15T10:30:00.000Z",
    modelPilot: {
      cost: 0.0012,
      latency: 850,
      provider: "openai"
    }
  }
}
```

### Real-World Examples

**Welcome Email Generator**

```javascript
// Prompt template (create this in Firestore)
{
  id: "welcome-email",
  template: "Write a warm welcome email for {{name}} who just joined {{company}}. Mention their role as {{role}}."
}

// Function call
const result = await processPrompt({
  promptId: "welcome-email",
  context: {
    name: "Alice",
    company: "TechCorp",
    role: "Software Engineer"
  }
});
```

**Customer Support Response**

```javascript
// Prompt template
{
  id: "support-response",
  template: "Customer Issue: {{issue}}\nCustomer History: {{customerType}}\nProvide a helpful, empathetic response."
}

// Function call
const result = await processPrompt({
  promptId: "support-response",
  context: {
    issue: "Can't reset password",
    customerType: "Premium, 2 years"
  }
});
```

**Blog Content Generator**

```javascript
// Prompt template with advanced parameters
{
  id: "blog-intro",
  template: "Write an engaging blog post introduction about {{topic}}. Target audience: {{audience}}.",
  maxTokens: 250,
  temperature: 0.9
}

// Function call with overrides
const result = await processPrompt({
  promptId: "blog-intro",
  context: {
    topic: "AI in Healthcare",
    audience: "Healthcare professionals"
  },
  maxTokens: 300,  // Override template setting
  temperature: 0.85
});
```

### Platform-Specific Examples

**React / React Native**

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

function useModelPilot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processPrompt = async (promptId, context) => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const callable = httpsCallable(
        functions,
        'ext-firestore-modelpilot-prompts-processPrompt'
      );
      const result = await callable({ promptId, context });
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { processPrompt, loading, error };
}
```

**Node.js / Cloud Functions**

```javascript
const { initializeApp } = require('firebase-admin/app');
const { getFunctions } = require('firebase-admin/functions');

initializeApp();

exports.generateContent = functions.https.onCall(async (data, context) => {
  const processPrompt = getFunctions().httpsCallable(
    'ext-firestore-modelpilot-prompts-processPrompt'
  );

  const result = await processPrompt({
    promptId: 'welcome-email',
    context: {
      userName: context.auth.displayName,
      userEmail: context.auth.email,
    },
  });

  return result.data;
});
```

**Flutter / Dart**

```dart
import 'package:cloud_functions/cloud_functions.dart';

Future<Map<String, dynamic>> processPrompt(
  String promptId,
  Map<String, dynamic> context
) async {
  final callable = FirebaseFunctions.instance.httpsCallable(
    'ext-firestore-modelpilot-prompts-processPrompt'
  );

  final result = await callable.call({
    'promptId': promptId,
    'context': context,
  });

  return result.data;
}
```

### Pre-processing Hook (Advanced)

This extension supports a **synchronous preprocessing hook** that allows you to execute custom logic before prompts are processed by ModelPilot. This is useful for:

- **Input validation**: Verify user permissions or rate limits
- **Data transformation**: Modify or enrich the context data
- **Content filtering**: Block inappropriate content
- **Logging and analytics**: Track usage patterns
- **Dynamic prompt selection**: Change promptId based on conditions

#### How to Use the Preprocessing Hook

1. **Create a preprocessing Cloud Function**:

```javascript
import { onRequest } from 'firebase-functions/v2/https';

export const preprocessPrompt = onRequest(async (request, response) => {
  try {
    const { data, auth } = request.body;

    // Example: Check user permissions
    if (auth && !isUserAllowed(auth.uid)) {
      throw new Error('User not authorized');
    }

    // Example: Add additional context
    const enrichedData = {
      ...data,
      context: {
        ...data.context,
        timestamp: new Date().toISOString(),
        userId: auth?.uid || 'anonymous',
      },
    };

    // Example: Transform promptId based on user tier
    if (auth && isPremiumUser(auth.uid)) {
      enrichedData.promptId = `premium-${data.promptId}`;
    }

    // Return the processed data
    response.json({ data: enrichedData });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});
```

2. **Deploy your preprocessing function**:

```bash
firebase deploy --only functions:preprocessPrompt
```

3. **Configure the extension** with your function URL:
   - In the Firebase Console, go to Extensions
   - Click on your installed ModelPilot extension
   - Add the preprocessing function URL:
     ```
     https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/preprocessPrompt
     ```

#### Preprocessing Function Specifications

**Input Format**

Your preprocessing function receives a POST request with:

```javascript
{
  data: {
    promptId: string,
    context?: object,
    maxTokens?: number,
    temperature?: number,
    topP?: number
  },
  auth: {
    uid: string,
    token: object
  } | null
}
```

**Output Format**

Your function must return:

```javascript
{
  data: {
    promptId: string,      // Can be modified
    context?: object,      // Can be modified
    maxTokens?: number,    // Can be modified
    temperature?: number,  // Can be modified
    topP?: number         // Can be modified
  }
}
```

**Important Considerations**

- **Execution Point**: Runs immediately after input validation, before fetching the prompt template
- **Timeout**: 10 second timeout - keep preprocessing fast
- **Error Handling**: If preprocessing fails, the entire prompt processing fails
- **Avoid Loops**: ⚠️ **WARNING** - Do not call the ModelPilot extension from within your preprocessing function, as this will cause an infinite loop
- **Authentication**: The `auth` object contains the user's authentication info (if authenticated)
- **Return Value**: Must return modified data in the `{ data: {...} }` format

#### Example Use Cases

**Rate Limiting per User**

```javascript
export const preprocessPrompt = onRequest(async (request, response) => {
  const { data, auth } = request.body;

  if (auth) {
    const rateLimitKey = `ratelimit:${auth.uid}`;
    const count = await incrementRateLimit(rateLimitKey);

    if (count > 100) {
      throw new Error('Rate limit exceeded');
    }
  }

  response.json({ data });
});
```

**Content Moderation**

```javascript
export const preprocessPrompt = onRequest(async (request, response) => {
  const { data } = request.body;

  // Check for inappropriate content in context
  if (containsInappropriateContent(data.context)) {
    throw new Error('Content violates policy');
  }

  response.json({ data });
});
```

**Dynamic Context Enrichment**

```javascript
export const preprocessPrompt = onRequest(async (request, response) => {
  const { data, auth } = request.body;

  // Fetch user profile data
  const userProfile = await getUserProfile(auth?.uid);

  // Add to context
  const enrichedData = {
    ...data,
    context: {
      ...data.context,
      userPreferences: userProfile.preferences,
      userName: userProfile.displayName,
    },
  };

  response.json({ data: enrichedData });
});
```

### Monitoring

Monitor extension performance through:

- **Cloud Functions logs**: View processing details, errors, and function invocations
- **Function response metadata**: Check `metadata.modelPilot.cost` and `metadata.modelPilot.latency` in each response
- **ModelPilot Dashboard**: View aggregated analytics, cost tracking, and usage patterns at https://modelpilot.co/dashboard
- **Preprocessing logs**: Monitor preprocessing function execution in Cloud Functions logs

### Best Practices

1. **Create reusable templates**: Store common prompts as templates for consistency
2. **Monitor costs**: Log `metadata.modelPilot.cost` from responses to track spending
3. **Set reasonable max_tokens**: Prevent unexpectedly long/expensive responses
4. **Handle errors gracefully**: Wrap function calls in try-catch blocks
5. **Use appropriate context**: Only pass necessary data to keep prompts focused
6. **Test templates**: Test Handlebars syntax with sample data before deployment
7. **Implement rate limiting**: Add client-side throttling for user-facing features

### Security Considerations

- The function is callable from authenticated and unauthenticated clients by default
- Add authentication checks in your app code or security rules if needed
- Consider implementing server-side validation for sensitive use cases
- Monitor function invocations to detect abuse
- Use Firebase App Check to prevent unauthorized access

### Troubleshooting

**Error: "invalid-argument"**

- Ensure you're passing the `promptId` parameter
- Check that promptId is a string

**Error: "not-found"**

- Verify the prompt template document exists in Firestore
- Check the document ID matches the promptId you're passing
- Ensure the prompts collection name is correct (default: "prompts")

**Error: "failed-precondition"**

- The prompt template is missing the `template` field
- Add a `template` field to your prompt document

**Template variables not rendering**

- Check Handlebars syntax in your template
- Verify context object structure matches template variables
- Review Cloud Functions logs for specific rendering errors

**High latency or costs**

- Check `metadata.modelPilot.latency` and adjust router configuration
- Reduce `maxTokens` in templates or function calls
- Review ModelPilot dashboard for model selection patterns

For more help, visit [ModelPilot Support](https://modelpilot.co/support) or check the [documentation](https://docs.modelpilot.co).
