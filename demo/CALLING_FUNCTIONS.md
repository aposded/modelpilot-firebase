# How to Call Firebase Callable Functions (Avoid CORS Errors!)

## 🚨 The Problem

You're getting a **CORS error** when trying to call your extension function. This happens because you're calling it incorrectly as a regular HTTP endpoint instead of using Firebase's callable function protocol.

## ❌ WRONG - Direct HTTP Call (Causes CORS Errors)

```javascript
// DON'T DO THIS!
const response = await fetch(
  'https://us-central1-myproject.cloudfunctions.net/ext-modelpilot-router-firebase-0fik-processprompt',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      promptId: 'welcome-email',
      context: { userName: 'John' },
    }),
  }
);

// Result: CORS error! 🔥
// Error: Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

```javascript
// DON'T DO THIS EITHER!
const response = await axios.post(
  'https://us-central1-myproject.cloudfunctions.net/ext-modelpilot-router-firebase-0fik-processprompt',
  {
    promptId: 'welcome-email',
    context: { userName: 'John' },
  }
);

// Result: CORS error! 🔥
```

## ✅ CORRECT - Use Firebase httpsCallable

### Web (JavaScript/TypeScript)

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processPrompt = httpsCallable(
  functions,
  'ext-modelpilot-router-firebase-0fik-processprompt'
);

const result = await processPrompt({
  promptId: 'welcome-email',
  context: {
    userName: 'John',
    productName: 'MyApp',
  },
});

console.log('Response:', result.data.response);
console.log('Cost:', result.data.metadata.modelPilot.cost);
```

### React Example

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

function AIComponent() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const generateContent = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const processPrompt = httpsCallable(
        functions,
        'ext-modelpilot-router-firebase-0fik-processprompt'
      );

      const result = await processPrompt({
        promptId: 'welcome-email',
        context: { userName: 'John', productName: 'MyApp' },
      });

      setResponse(result.data.response);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={generateContent} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Content'}
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

### Node.js (Firebase Admin SDK)

```javascript
const { initializeApp } = require('firebase-admin/app');
const { getFunctions } = require('firebase-admin/functions');

initializeApp();

async function callExtension() {
  const functions = getFunctions();
  const processPrompt = functions.httpsCallable(
    'ext-modelpilot-router-firebase-0fik-processprompt'
  );

  const result = await processPrompt({
    promptId: 'welcome-email',
    context: {
      userName: 'John',
      productName: 'MyApp',
    },
  });

  console.log('Response:', result.data.response);
  return result.data;
}

callExtension();
```

### iOS (Swift)

```swift
import FirebaseFunctions

lazy var functions = Functions.functions()

func generateContent() {
    let processPrompt = functions.httpsCallable("ext-modelpilot-router-firebase-0fik-processprompt")

    processPrompt.call([
        "promptId": "welcome-email",
        "context": [
            "userName": "John",
            "productName": "MyApp"
        ]
    ]) { result, error in
        if let error = error {
            print("Error: \(error)")
            return
        }

        if let data = result?.data as? [String: Any],
           let response = data["response"] as? String {
            print("Response: \(response)")
        }
    }
}
```

### Android (Kotlin)

```kotlin
import com.google.firebase.functions.ktx.functions
import com.google.firebase.ktx.Firebase

val functions = Firebase.functions

fun generateContent() {
    val data = hashMapOf(
        "promptId" to "welcome-email",
        "context" to hashMapOf(
            "userName" to "John",
            "productName" to "MyApp"
        )
    )

    functions
        .getHttpsCallable("ext-modelpilot-router-firebase-0fik-processprompt")
        .call(data)
        .addOnSuccessListener { result ->
            val response = (result.data as Map<*, *>)["response"] as String
            println("Response: $response")
        }
        .addOnFailureListener { error ->
            println("Error: ${error.message}")
        }
}
```

## Why Use httpsCallable?

### 1. **No CORS Issues**

Firebase's `httpsCallable` handles CORS automatically. It's designed to work from web browsers.

### 2. **Automatic Authentication**

The user's Firebase auth token is automatically included in the request. The function can access `context.auth.uid` to identify the user.

### 3. **Proper Error Handling**

Firebase functions throw typed errors that the client SDK understands:

```javascript
try {
  const result = await processPrompt({ ... });
} catch (error) {
  if (error.code === 'unauthenticated') {
    console.log('User must sign in');
  } else if (error.code === 'not-found') {
    console.log('Prompt template not found');
  } else {
    console.log('Other error:', error.message);
  }
}
```

### 4. **Built-in Retry Logic**

The SDK automatically retries failed requests with exponential backoff.

### 5. **Type Safety**

With TypeScript, you get full type checking:

```typescript
import {
  getFunctions,
  httpsCallable,
  HttpsCallableResult,
} from 'firebase/functions';

interface ProcessPromptResponse {
  response: string;
  metadata: {
    model: string;
    usage: {
      total_tokens: number;
      prompt_tokens: number;
      completion_tokens: number;
    };
    modelPilot: {
      cost: number;
      latency: number;
      provider: string;
    };
  };
}

const functions = getFunctions();
const processPrompt = httpsCallable<
  { promptId: string; context: Record<string, any> },
  ProcessPromptResponse
>(functions, 'ext-modelpilot-router-firebase-0fik-processprompt');

const result = await processPrompt({
  promptId: 'welcome-email',
  context: { userName: 'John' },
});

// TypeScript knows result.data.response is a string!
console.log(result.data.response);
```

## Common Mistakes

### Mistake 1: Using the Function URL Directly

```javascript
// ❌ WRONG
const url = 'https://us-central1-myproject.cloudfunctions.net/ext-...';
fetch(url, { ... }); // CORS error!

// ✅ CORRECT
const processPrompt = httpsCallable(functions, 'ext-...');
processPrompt({ ... });
```

### Mistake 2: Not Initializing Firebase

```javascript
// ❌ WRONG - Firebase not initialized
const functions = getFunctions();
const processPrompt = httpsCallable(functions, 'ext-...');

// ✅ CORRECT
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const processPrompt = httpsCallable(functions, 'ext-...');
```

### Mistake 3: Wrong Function Name

```javascript
// ❌ WRONG - Using generic name
httpsCallable(functions, 'processPrompt'); // Function not found!

// ✅ CORRECT - Use the full extension function name
// Find it in Firebase Console → Functions
httpsCallable(functions, 'ext-modelpilot-router-firebase-0fik-processprompt');
```

## Finding Your Function Name

Your extension function name follows this pattern:

```
ext-{extension-name}-{random-id}-{function-name}
```

To find it:

1. Go to Firebase Console → Functions
2. Look for a function starting with `ext-modelpilot-router-firebase-`
3. Copy the exact name (e.g., `ext-modelpilot-router-firebase-0fik-processprompt`)
4. Use that in your code

## Testing

### Quick Test in Browser Console

```javascript
// 1. Open your web app
// 2. Open browser console (F12)
// 3. Paste this:

import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js')
  .then(({ getFunctions, httpsCallable }) => {
    const functions = getFunctions();
    const processPrompt = httpsCallable(
      functions,
      'ext-modelpilot-router-firebase-XXXX-processprompt' // Replace XXXX
    );

    return processPrompt({
      promptId: 'welcome-email',
      context: { userName: 'Test User', productName: 'Test App' },
    });
  })
  .then((result) => {
    console.log('✅ Success!');
    console.log('Response:', result.data.response);
    console.log('Cost:', result.data.metadata.modelPilot.cost);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
  });
```

## Summary

| Method                           | Result        |
| -------------------------------- | ------------- |
| `fetch(url, ...)`                | ❌ CORS Error |
| `axios.post(url, ...)`           | ❌ CORS Error |
| `httpsCallable(functions, name)` | ✅ Works!     |

**Always use `httpsCallable()` for Firebase callable functions!**
