// Quick test to verify Datadog LLM observability with direct provider usage
// Run with: DOTENV_CONFIG_PATH=.env.local node --require dotenv/config --require dd-trace/init test-dd-trace.js
// Note: dotenv/config must be loaded BEFORE dd-trace/init so environment variables are available
// All dd-trace configuration is done via environment variables

const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test() {
  console.log('Testing direct Google provider with Datadog...');
  
  try {
    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: 'Say hello in one word',
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'test-direct-provider',
      },
    });
    
    console.log('Result:', result.text);
    console.log('✅ Test completed - check Datadog dashboard in 10-15 seconds');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Give time for spans to flush
  setTimeout(() => {
    console.log('Exiting...');
    process.exit(0);
  }, 2000);
}

test();
