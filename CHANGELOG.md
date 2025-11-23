## Version 1.0.0

### Changes

- Tested Extension and ensured it is ready for release

## Version 0.3.0

### Breaking Changes

- **Migrated to 1st-gen Cloud Functions** - Firebase Extensions require 1st-gen functions for callable triggers. Updated from `firebase-functions/v2` to `firebase-functions/v1` API.
- **Updated extension.yaml** - Changed resource type from `firebaseextensions.v1beta.v2function` to `firebaseextensions.v1beta.function` with proper 1st-gen configuration.

### Changes

- Function signature updated to use `(data, context)` parameters instead of `(request)`
- Logger usage changed from `logger.info()` to `functions.logger.info()`
- HttpsError now imported from `firebase-functions/v1/https`
- Extension properties structure updated to match 1st-gen format (runtime, availableMemoryMb, timeout, httpsTrigger)

**Note:** This version is fully compatible with Firebase Extensions. No client-side changes are required - the function can still be called using the Firebase callable functions API from your app.

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

## Version 0.2.1

### Bug Fixes

- **Fixed CORS errors** - Added `invoker: public` to serviceConfig to properly allow Firebase SDK to call the function without CORS issues
- **Updated documentation** - Corrected function name pattern in POSTINSTALL.md to match actual extension name

## Version 0.2.0

### Features

- **Preprocessing function support** - Optional preprocessing function to transform or validate input data before it is processed by ModelPilot
- **Updated to Firebase Functions v2** - Updated to Firebase Functions v2 to take advantage of the latest features and improvements
