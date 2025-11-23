## Version 0.1.0

Initial release of the Process Prompts with ModelPilot extension.

### Features

- **Callable Cloud Function** for on-demand AI prompt processing
- **Handlebars template** support for dynamic content personalization
- **ModelPilot intelligent routing** for automatic model selection and cost optimization
- **Instant responses** - Function returns AI-generated content immediately
- **Detailed metadata** including model used, token usage, costs, latency, and provider
- **Flexible parameters** - Override temperature, max_tokens, and top_p per request
- **Comprehensive error handling** with proper HttpsError codes
- **Template management** via Firestore for reusable prompts
- **Cross-platform support** - Works with Web, iOS, Android, and Cloud Functions

## Version 0.2.0

### Features

- **Preprocessing function support** - Optional preprocessing function to transform or validate input data before it is processed by ModelPilot
- **Updated to Firebase Functions v2** - Updated to Firebase Functions v2 to take advantage of the latest features and improvements
