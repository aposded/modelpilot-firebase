/**
 * Setup Script - Create Sample Prompt Templates
 * 
 * This script creates the sample prompt templates needed for the demo.
 * Run this AFTER installing the ModelPilot extension.
 * 
 * Usage:
 *   node setup-prompts.js
 * 
 * Make sure you have:
 * 1. Firebase Admin SDK initialized
 * 2. Appropriate Firestore permissions
 * 3. Extension installed and configured
 */

const admin=require('firebase-admin');

// Initialize Firebase Admin
// Option 1: Use service account
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Use application default credentials (for Cloud Functions/Cloud Shell)
admin.initializeApp();

const db=admin.firestore();

// ⚠️ IMPORTANT: Update this to match your extension configuration
// Default is 'prompts' but you might have changed it during installation
const PROMPTS_COLLECTION='prompts';

const samplePrompts=[
    {
        id: 'welcome-email',
        data: {
            template: 'Write a friendly welcome email for {{userName}} who just signed up for {{productName}}. Make it warm and professional.',
            description: 'Welcome email template',
            maxTokens: 500,
            temperature: 0.7,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
    },
    {
        id: 'product-description',
        data: {
            template: 'Create an engaging product description for {{productName}}. Price: ${{price}}. Key features:\n{{#each features}}- {{this}}\n{{/each}}\n\nMake it compelling and highlight the value proposition.',
            description: 'Product description generator',
            maxTokens: 300,
            temperature: 0.8,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
    },
    {
        id: 'blog-intro',
        data: {
            template: 'Write an engaging blog post introduction about {{topic}}. Target audience: {{audience}}. Tone: {{tone}}. Hook the reader and make them want to continue reading.',
            description: 'Blog post introduction',
            maxTokens: 250,
            temperature: 0.9,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
    },
    {
        id: 'support-response',
        data: {
            template: 'Customer {{customerName}} has the following issue: {{issue}}\n\nProvide a helpful, empathetic support response that addresses their concern professionally.',
            description: 'Customer support response template',
            maxTokens: 400,
            temperature: 0.6,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
    },
    {
        id: 'social-media-post',
        data: {
            template: 'Create a {{platform}} post about {{topic}}. Tone: {{tone}}. Include relevant hashtags and make it engaging for {{targetAudience}}.',
            description: 'Social media post generator',
            maxTokens: 200,
            temperature: 0.85,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
    }
];

async function setupPrompts() {
    console.log('🚀 Setting up sample prompt templates...\n');
    console.log(`Collection: ${PROMPTS_COLLECTION}\n`);

    let successCount=0;
    let errorCount=0;

    for(const prompt of samplePrompts) {
        try {
            await db.collection(PROMPTS_COLLECTION).doc(prompt.id).set(prompt.data);
            console.log(`✅ Created: ${prompt.id}`);
            console.log(`   Description: ${prompt.data.description}`);
            console.log(`   Max Tokens: ${prompt.data.maxTokens}`);
            console.log(`   Temperature: ${prompt.data.temperature}\n`);
            successCount++;
        } catch(error) {
            console.error(`❌ Failed to create ${prompt.id}:`,error.message,'\n');
            errorCount++;
        }
    }

    console.log('─'.repeat(50));
    console.log(`\n✨ Setup complete!`);
    console.log(`   Created: ${successCount} prompts`);
    if(errorCount>0) {
        console.log(`   Failed: ${errorCount} prompts`);
    }
    console.log('\n📝 Next steps:');
    console.log('   1. Update demo/index.html with your Firebase config');
    console.log('   2. Update demo/index.html with your function name');
    console.log('   3. Enable Google Sign-In in Firebase Console');
    console.log('   4. Open demo/index.html in a browser');
    console.log('\n🎉 Happy testing!');
}

// Run the setup
setupPrompts()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n💥 Setup failed:',error);
        process.exit(1);
    });
