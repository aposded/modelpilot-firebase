# Example Preprocessing Function

This file contains example implementations of preprocessing functions that can be used with the ModelPilot Firebase Extension.

## Basic Example

```javascript
import { onRequest } from 'firebase-functions/v2/https';

export const preprocessPrompt = onRequest(async (request, response) => {
  try {
    const { data, auth } = request.body;

    console.log('Preprocessing prompt:', {
      promptId: data.promptId,
      userId: auth?.uid || 'anonymous',
    });

    // Simply pass through the data unchanged
    response.json({ data });
  } catch (error) {
    console.error('Preprocessing error:', error);
    response.status(400).json({ error: error.message });
  }
});
```

## Advanced Example with Validation, Transformation, and Rate Limiting

```javascript
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const preprocessPrompt = onRequest(async (request, response) => {
  try {
    const { data, auth } = request.body;

    // 1. AUTHENTICATION CHECK
    if (!auth) {
      throw new Error('Authentication required');
    }

    // 2. RATE LIMITING
    const userId = auth.uid;
    const rateLimitDoc = db.collection('rateLimits').doc(userId);
    const rateLimitData = await rateLimitDoc.get();

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (rateLimitData.exists) {
      const { count, resetTime } = rateLimitData.data();

      if (now < resetTime) {
        // Within rate limit window
        if (count >= 100) {
          throw new Error('Rate limit exceeded. Try again later.');
        }
        await rateLimitDoc.update({ count: count + 1 });
      } else {
        // Reset rate limit
        await rateLimitDoc.set({ count: 1, resetTime: now + oneHour });
      }
    } else {
      // First request
      await rateLimitDoc.set({ count: 1, resetTime: now + oneHour });
    }

    // 3. CONTENT VALIDATION
    if (data.context) {
      // Check for banned words
      const bannedWords = ['spam', 'illegal', 'hack'];
      const contextStr = JSON.stringify(data.context).toLowerCase();

      for (const word of bannedWords) {
        if (contextStr.includes(word)) {
          throw new Error('Content contains prohibited words');
        }
      }
    }

    // 4. USER TIER DETECTION AND PROMPT ROUTING
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isPremium = userData?.tier === 'premium';

    let promptId = data.promptId;

    // Route to premium prompts for premium users
    if (isPremium && !promptId.startsWith('premium-')) {
      promptId = `premium-${promptId}`;
    }

    // 5. CONTEXT ENRICHMENT
    const enrichedContext = {
      ...data.context,
      // Add metadata
      userId: userId,
      userName: userData?.displayName || 'User',
      userTier: userData?.tier || 'free',
      timestamp: new Date().toISOString(),
      // Add user preferences
      language: userData?.language || 'en',
      timezone: userData?.timezone || 'UTC',
    };

    // 6. PARAMETER OPTIMIZATION
    let maxTokens = data.maxTokens;
    let temperature = data.temperature;

    // Adjust based on user tier
    if (isPremium) {
      maxTokens = maxTokens || 1000; // Higher default for premium
      temperature = temperature ?? 0.7;
    } else {
      maxTokens = Math.min(maxTokens || 500, 500); // Cap for free tier
      temperature = temperature ?? 0.5;
    }

    // 7. LOGGING AND ANALYTICS
    await db.collection('promptLogs').add({
      userId: userId,
      promptId: promptId,
      originalPromptId: data.promptId,
      userTier: userData?.tier || 'free',
      timestamp: new Date(),
    });

    // 8. RETURN PROCESSED DATA
    const processedData = {
      promptId: promptId,
      context: enrichedContext,
      maxTokens: maxTokens,
      temperature: temperature,
      topP: data.topP,
    };

    console.log('Preprocessing successful:', {
      userId,
      originalPromptId: data.promptId,
      newPromptId: promptId,
      userTier: userData?.tier,
    });

    response.json({ data: processedData });
  } catch (error) {
    console.error('Preprocessing failed:', error);
    response.status(400).json({
      error: error.message,
      code: error.code || 'PREPROCESSING_ERROR',
    });
  }
});
```

## Testing Your Preprocessing Function

### 1. Deploy the function

```bash
firebase deploy --only functions:preprocessPrompt
```

### 2. Get the function URL

After deployment, you'll see output like:

```
✓  functions[preprocessPrompt(us-central1)] Deployed
   https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/preprocessPrompt
```

### 3. Test manually with curl

```bash
curl -X POST \
  https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/preprocessPrompt \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "promptId": "test-prompt",
      "context": {
        "message": "Hello world"
      }
    },
    "auth": {
      "uid": "test-user-123",
      "token": {}
    }
  }'
```

Expected response:

```json
{
  "data": {
    "promptId": "test-prompt",
    "context": {
      "message": "Hello world",
      "userId": "test-user-123",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 4. Configure the extension

1. Go to Firebase Console → Extensions
2. Click on your ModelPilot extension
3. Click "Manage" → "Reconfigure extension"
4. Add the function URL to "Pre-processing function URL"
5. Save

### 5. Test end-to-end

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processPrompt = httpsCallable(
  functions,
  'ext-firestore-modelpilot-prompts-processPrompt'
);

const result = await processPrompt({
  promptId: 'test-prompt',
  context: {
    message: 'Test message',
  },
});

console.log('Result:', result.data);
```

## Common Patterns

### Pattern 1: User Permission Check

```javascript
const userDoc = await db.collection('users').doc(auth.uid).get();
if (!userDoc.exists || !userDoc.data().canUseAI) {
  throw new Error('User does not have permission to use AI features');
}
```

### Pattern 2: Cost Control

```javascript
const userDoc = await db.collection('users').doc(auth.uid).get();
const userData = userDoc.data();

// Check remaining credits
if (userData.credits <= 0) {
  throw new Error('Insufficient credits');
}

// Cap token usage based on credits
const maxAllowedTokens = Math.min(userData.credits * 10, data.maxTokens || 500);
```

### Pattern 3: A/B Testing

```javascript
const experimentGroup = hash(auth.uid) % 2; // 0 or 1

if (experimentGroup === 0) {
  // Control group - standard prompt
  processedData.promptId = data.promptId;
} else {
  // Treatment group - modified prompt
  processedData.promptId = `${data.promptId}-v2`;
}

// Log experiment assignment
await db.collection('experiments').add({
  userId: auth.uid,
  group: experimentGroup,
  timestamp: new Date(),
});
```

### Pattern 4: Content Safety

```javascript
import { moderateText } from './moderation';

const contentToCheck = JSON.stringify(data.context);
const moderationResult = await moderateText(contentToCheck);

if (moderationResult.flagged) {
  throw new Error('Content violates community guidelines');
}
```

## Troubleshooting

### Issue: Function times out

**Solution**: Add timeout handling and keep preprocessing fast (<2 seconds)

```javascript
const TIMEOUT = 5000; // 5 seconds

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Preprocessing timeout')), TIMEOUT);
});

const processingPromise = async () => {
  // Your preprocessing logic here
};

const result = await Promise.race([processingPromise(), timeoutPromise]);
```

### Issue: Function called in loop

**Solution**: Never call the ModelPilot extension from preprocessing

```javascript
// ❌ WRONG - Creates infinite loop
const result = await processPrompt({ promptId: 'test' });

// ✅ CORRECT - Only transform and return data
response.json({ data: processedData });
```

### Issue: Authentication errors

**Solution**: Check if auth object exists before using

```javascript
if (!auth) {
  // Handle unauthenticated requests
  response.json({ data }); // Pass through or reject
  return;
}

const userId = auth.uid;
// Continue with authenticated logic
```

## Best Practices

1. **Keep it fast**: Aim for <1 second execution time
2. **Handle errors gracefully**: Always wrap in try-catch
3. **Log important events**: Use console.log for debugging
4. **Return proper format**: Always return `{ data: {...} }`
5. **Test thoroughly**: Test with various inputs before deploying
6. **Monitor in production**: Check Cloud Functions logs regularly
7. **Avoid external API calls**: Keep dependencies minimal
8. **Use caching**: Cache user data to reduce Firestore reads
9. **Set timeouts**: Prevent hanging requests
10. **Document your logic**: Add comments explaining transformations
