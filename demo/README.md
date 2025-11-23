# ModelPilot Extension Demo

This demo shows how to:

- ✅ Sign in with Google using Firebase Authentication
- ✅ Call the ModelPilot extension **correctly** as a callable function (not HTTP)
- ✅ Display AI responses with metadata (cost, tokens, latency)

## 🚨 IMPORTANT: How to Call the Function

The extension provides a **callable Cloud Function**, not a regular HTTP endpoint. You MUST call it using Firebase's `httpsCallable()` method:

```javascript
// ✅ CORRECT - Use httpsCallable
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processPrompt = httpsCallable(
  functions,
  'ext-modelpilot-router-firebase-XXXX-processprompt'
);

const result = await processPrompt({
  promptId: 'welcome-email',
  context: { userName: 'John', productName: 'MyApp' },
});
```

```javascript
// ❌ WRONG - Do NOT use fetch/axios
// This will cause CORS errors!
const response = await fetch('https://us-central1-project.cloudfunctions.net/ext-...', {
  method: 'POST',
  body: JSON.stringify({...})
});
```

## Setup Instructions

### 1. Find Your Function Name

After installing the extension, find the actual function name in your Firebase Console:

1. Go to Firebase Console → Functions
2. Look for a function like: `ext-modelpilot-router-firebase-XXXX-processprompt`
3. Copy the exact name

### 2. Configure the Demo

Edit `index.html` and update these values:

```javascript
// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Replace with your actual function name from step 1
const FUNCTION_NAME = 'ext-modelpilot-router-firebase-XXXX-processprompt';
```

### 3. Enable Google Sign-In

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Google" provider
3. Add your domain to authorized domains (for local testing, add `localhost`)

### 4. Create Sample Prompts

The demo expects these prompt templates in Firestore:

```javascript
// Run this in Firebase Console → Firestore or via Node.js

// Collection: prompts (or whatever you configured in extension params)

// Document: welcome-email
{
  template: "Write a friendly welcome email for {{userName}} who just signed up for {{productName}}.",
  maxTokens: 500,
  temperature: 0.7
}

// Document: product-description
{
  template: "Create an engaging product description for {{productName}}. Price: ${{price}}. Key features: {{#each features}}- {{this}}\n{{/each}}",
  maxTokens: 300,
  temperature: 0.8
}

// Document: blog-intro
{
  template: "Write an engaging blog post introduction about {{topic}}. Target audience: {{audience}}. Tone: {{tone}}.",
  maxTokens: 250,
  temperature: 0.9
}
```

### 5. Run the Demo

**Option A: Simple HTTP Server**

```bash
cd demo
python3 -m http.server 8000
# Open http://localhost:8000
```

**Option B: Firebase Hosting (Recommended)**

```bash
# Initialize hosting in the demo folder
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### 6. Test It

1. Open the demo in your browser
2. Click "Sign in with Google"
3. Select a prompt template
4. Fill in the required fields
5. Click "Generate Content"
6. See AI response with cost/token metadata!

## Troubleshooting

### CORS Errors

**Problem:** Getting CORS errors when calling the function

**Solution:** You're calling it wrong! Use `httpsCallable()` not `fetch()`. See the IMPORTANT section above.

### "Function not found" Error

**Problem:** `Function not found: ext-modelpilot-router-firebase-XXXX-processprompt`

**Solution:**

1. Check Firebase Console → Functions for the exact function name
2. Update `FUNCTION_NAME` in index.html
3. Make sure the extension is installed and deployed

### "Unauthenticated" Error

**Problem:** Function requires authentication but user isn't signed in

**Solution:** The extension function checks for authentication. Make sure:

1. User is signed in with Google
2. You're passing the auth token (httpsCallable handles this automatically)

### "Prompt template not found"

**Problem:** Firestore doesn't have the prompt template

**Solution:**

1. Create the prompt documents in Firestore (see step 4 above)
2. Make sure the collection name matches your extension config (default: `prompts`)
3. Document IDs must match exactly: `welcome-email`, `product-description`, `blog-intro`

## How It Works

1. **Authentication**: Uses Firebase Auth with Google provider
2. **Function Call**: Uses `httpsCallable()` to invoke the extension function
3. **Request**: Sends `{ promptId, context }` to the function
4. **Processing**: Extension fetches template from Firestore, compiles with Handlebars, sends to ModelPilot
5. **Response**: Returns AI-generated content + metadata (cost, tokens, latency, model)

## Security Notes

- The demo requires users to sign in (good practice!)
- The extension function can check `context.auth.uid` for user-specific logic
- Add Firestore security rules to protect your prompt templates
- Consider rate limiting to prevent abuse

## Next Steps

- Add more prompt templates
- Create a preprocessing function for input validation
- Track usage in Firestore for analytics
- Build this into your actual application

## Need Help?

Check the main documentation:

- `/POSTINSTALL.md` - Post-installation guide
- `/EXAMPLE_SETUP.md` - More code examples
- `/EXAMPLE_PREPROCESSING_FUNCTION.md` - Input validation examples
