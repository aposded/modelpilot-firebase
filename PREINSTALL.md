<!--
This file provides your users an overview of your extension. All content is optional, but this is the recommended format. Your users will see the contents of this file when they run the `firebase ext:info` command.

Include any important functional details as well as a brief description for any additional setup required by the user (both pre- and post-installation).

Learn more about writing a PREINSTALL.md file in the docs:
https://firebase.google.com/docs/extensions/publishers/user-documentation#writing-preinstall
-->

Use this extension to add AI-powered prompt processing to your Firebase app using ModelPilot's intelligent model routing system.

This extension provides a callable Cloud Function that:

- Fetches prompt templates with Handlebars syntax from your Firestore prompts collection
- Renders templates with dynamic user data
- Calls ModelPilot API for intelligent AI model selection
- Returns AI responses instantly with detailed metadata

# Additional setup

Before installing this extension, make sure that you've:

1. **Set up Cloud Firestore**: [Create a Firestore database](https://firebase.google.com/docs/firestore/quickstart) in your Firebase project

2. **Get a ModelPilot API Key**:

   - Sign up at [ModelPilot](https://modelpilot.co)
   - Create a router in the dashboard
   - Copy your API key and Router ID

3. **Create your prompts collection**:
   - Create a Firestore collection (default name: `prompts`)
   - Add prompt template documents with at least a `template` field

# Billing

To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)

- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service's no-cost tier:
  - Cloud Firestore (reads/writes for prompt templates and responses)
  - Cloud Functions (executions for processing documents)
  - ModelPilot API (pay-as-you-go AI inference, typically 40-70% cheaper than direct providers)

You can monitor costs in:

- Firebase Console for Firestore and Functions
- ModelPilot Dashboard for AI API usage
- Each processed document's metadata includes the exact cost of that request, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)
