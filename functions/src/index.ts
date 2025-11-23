/**
 * ModelPilot Firebase Extension
 * Callable function to process AI prompts using ModelPilot intelligent routing
 * with support for Handlebars templates for dynamic personalization
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Handlebars from 'handlebars';
import ModelPilot from 'modelpilot';
import axios from 'axios';

// Initialize Firebase Admin
admin.initializeApp();

// Extension configuration from environment variables
const config = {
  apiKey: process.env.MODELPILOT_API_KEY || '',
  routerId: process.env.MODELPILOT_ROUTER_ID || '',
  promptsCollection: process.env.PROMPTS_COLLECTION || 'prompts',
  preprocessingFunctionUrl: process.env.PREPROCESSING_FUNCTION_URL || '',
};

// Initialize ModelPilot client
const modelPilot = new ModelPilot({
  apiKey: config.apiKey,
  routerId: config.routerId,
});

/**
 * Request data interface for processPrompt callable function
 */
interface ProcessPromptRequest {
  promptId: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

/**
 * Callable function that processes prompts with AI using ModelPilot
 *
 * @param data.promptId - ID of the prompt template in the prompts collection
 * @param data.context - Optional context object for Handlebars template
 * @param data.maxTokens - Optional max_tokens override
 * @param data.temperature - Optional temperature override (0-1)
 * @param data.topP - Optional top_p override (0-1)
 *
 * @returns Object with response, metadata, and model information
 */
export const processPrompt = functions.https.onCall<ProcessPromptRequest>(
  async (request) => {
    try {
      // Validate required fields
      if (!request.data.promptId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required field: promptId'
        );
      }

      // PREPROCESSING_FUNCTION_URL hook begins here
      // If a preprocessing function is defined, call it before continuing
      let processedData = request.data;
      if (config.preprocessingFunctionUrl) {
        try {
          functions.logger.info('Calling preprocessing function', {
            url: config.preprocessingFunctionUrl,
            promptId: request.data.promptId,
          });

          const preprocessResponse = await axios.post(
            config.preprocessingFunctionUrl,
            {
              data: request.data,
              auth: request.auth
                ? {
                    uid: request.auth.uid,
                    token: request.auth.token,
                  }
                : null,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 10000, // 10 second timeout
            }
          );

          // Use the processed data returned from the preprocessing function
          // The preprocessing function can modify promptId, context, or parameters
          if (preprocessResponse.data && preprocessResponse.data.data) {
            processedData = preprocessResponse.data.data;
            functions.logger.info('Preprocessing completed successfully');
          }
        } catch (error) {
          // Preprocessing failure causes the function to fail
          functions.logger.error('Preprocessing error:', error);
          throw new functions.https.HttpsError(
            'internal',
            `Preprocessing function failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            error
          );
        }
      }
      // End of PREPROCESSING_FUNCTION_URL hook

      // Fetch the prompt template from the prompts collection
      const promptDoc = await admin
        .firestore()
        .collection(config.promptsCollection)
        .doc(processedData.promptId)
        .get();

      if (!promptDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          `Prompt template not found: ${processedData.promptId}`
        );
      }

      const promptData = promptDoc.data();
      if (!promptData?.template) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Prompt template is missing "template" field'
        );
      }

      // Compile and render the Handlebars template
      const template = Handlebars.compile(promptData.template);
      const renderedPrompt = template(processedData.context || {});

      functions.logger.info('Processing prompt', {
        uid: request.auth?.uid,
        promptId: processedData.promptId,
        renderedPrompt,
      });

      // Call ModelPilot API
      const completion = await modelPilot.chat.create({
        messages: [
          {
            role: 'user',
            content: renderedPrompt,
          },
        ],
        // Optional: allow caller to override these settings
        max_tokens: processedData.maxTokens || promptData.maxTokens,
        temperature: processedData.temperature ?? promptData.temperature,
        top_p: processedData.topP ?? promptData.topP,
      });

      // Extract response content
      const responseContent = completion.choices[0]?.message?.content || '';

      // Prepare metadata
      const metadata: any = {
        model: completion.model,
        usage: completion.usage,
        finishReason: completion.choices[0]?.finish_reason,
        timestamp: new Date().toISOString(),
      };

      // Add ModelPilot-specific metadata if available
      if (completion._meta) {
        metadata.modelPilot = {
          cost: completion._meta.cost,
          latency: completion._meta.latency,
          provider: completion._meta.modelUsed,
        };
      }

      functions.logger.info('Successfully processed prompt', {
        uid: request.auth?.uid,
        promptId: processedData.promptId,
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
        cost: completion._meta?.cost,
      });

      // Return response directly to caller
      return {
        success: true,
        response: responseContent,
        metadata,
      };
    } catch (error) {
      functions.logger.error('Error processing prompt', {
        uid: request.auth?.uid,
        promptId: request.data?.promptId,
        error: error instanceof Error ? error.message : String(error),
      });

      // If it's already an HttpsError, rethrow it
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Otherwise, wrap it in an internal error
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'An unknown error occurred',
        error
      );
    }
  }
);
