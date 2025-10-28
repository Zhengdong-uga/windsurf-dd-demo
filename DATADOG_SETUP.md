# Datadog Instrumentation Setup Guide

Complete guide for setting up Datadog APM and LLM Observability in a Next.js application with the Vercel AI SDK.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Next.js Configuration for Bundling](#nextjs-configuration-for-bundling)
- [Initialization](#initialization)
- [LLM Observability Setup](#llm-observability-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [References](#references)

---

## Prerequisites

- Node.js >= 18 (or >= 16 with `dd-trace@latest-node16`)
- A Datadog account with an API key
- Know your Datadog site (e.g., `datadoghq.com`, `us3.datadoghq.com`, `eu1.datadoghq.com`)

---

## Installation

Install the Datadog tracing library:

```bash
npm install dd-trace --save
# or
pnpm add dd-trace
```

For Node.js 16:
```bash
npm install dd-trace@latest-node16
```

---

## Environment Variables Configuration

Create or update your `.env.local` file with the following variables:

### Required Variables

```env
# Service identification (Unified Service Tagging)
DD_SERVICE=windsurf-dd-demo
DD_ENV=development
DD_VERSION=1.0.0

# Datadog site and API key
DD_SITE=us3.datadoghq.com
DD_API_KEY=your_datadog_api_key_here

# Enable tracing
DD_TRACE_ENABLED=1
```

### LLM Observability Variables

```env
# Enable LLM Observability
DD_LLMOBS_ENABLED=1

# CRITICAL: Enable agentless mode to send data directly to Datadog
# (no local agent required)
DD_LLMOBS_AGENTLESS_ENABLED=1

# Your ML application name (lowercase, alphanumerics, underscores, hyphens)
DD_LLMOBS_ML_APP=windsurf-dd-demo
```

### Optional Variables

```env
# Debug logging (useful during setup)
DD_TRACE_DEBUG=false

# Logs correlation (adds trace IDs to logs)
DD_LOGS_INJECTION=true

# Runtime metrics
DD_RUNTIME_METRICS_ENABLED=true

# Global tags
DD_TAGS=team:ai,feature:chat
```

### Important Notes

- **Agentless mode**: When `DD_LLMOBS_AGENTLESS_ENABLED=1`, traces are sent directly to Datadog's intake without requiring a local Datadog Agent
- **API Key**: Get your API key from [Datadog Organization Settings](https://app.datadoghq.com/organization-settings/api-keys)
- **DD_SITE**: Must match your Datadog account's region

---

## Next.js Configuration for Bundling

**CRITICAL**: For Datadog auto-instrumentation to work with the Vercel AI SDK, you must prevent webpack from bundling certain packages. Datadog's tracer uses dynamic instrumentation that breaks when packages are bundled.

### Step 1: Update `next.config.ts`

Add the following configuration to mark AI SDK packages as external:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    // Mark AI SDK packages as external for proper Datadog instrumentation
    // These packages will NOT be bundled by webpack
    serverComponentsExternalPackages: [
      "ai",                    // Vercel AI SDK core
      "@ai-sdk/google",        // Google provider
      "@ai-sdk/openai",        // OpenAI provider
      "@ai-sdk/xai",          // xAI provider
      "dd-trace",             // Datadog tracer
      "@datadog/libdatadog",  // Datadog native library
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Additional externals for server-side webpack
      config.externals.push("openai", "dd-trace", "@datadog/libdatadog");
      
      // Add fallback for graphql to prevent dd-trace errors
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        graphql: false,
      };
    }
    return config;
  },
};

export default nextConfig;
```

### Why This Matters

- **Auto-instrumentation requires runtime access**: Datadog's tracer patches modules at runtime by intercepting `require()` calls
- **Bundling breaks patching**: When webpack bundles the AI SDK, the tracer can't intercept and instrument the calls
- **serverComponentsExternalPackages**: Tells Next.js to load these packages from `node_modules` at runtime instead of bundling them

---

## Initialization

Datadog must be initialized **BEFORE** any instrumented modules are imported. For Next.js, use Node.js command-line options.

### Step 1: Update `package.json` scripts

Modify your dev and start scripts to load `dd-trace` before Next.js starts:

```json
{
  "scripts": {
    "dev": "DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS=\"--require dotenv/config --import dd-trace/initialize.mjs\" next dev",
    "start": "DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS=\"--require dotenv/config --import dd-trace/initialize.mjs\" next start",
    "build": "next build"
  }
}
```

### Explanation of flags:

- `DOTENV_CONFIG_PATH=.env.local`: Specifies which env file to load
- `--require dotenv/config`: Loads environment variables **first**
- `--import dd-trace/initialize.mjs`: Initializes the Datadog tracer (ESM style)
- Order matters: Environment variables must be loaded before dd-trace initializes

### Step 2: Create `instrumentation.ts` (Optional)

Next.js 13+ supports an instrumentation hook. Create `instrumentation.ts` in your root:

```typescript
import { registerOTel } from "@vercel/otel";

export function register() {
  // Note: Datadog tracer is initialized via NODE_OPTIONS="--import dd-trace/initialize.mjs"
  // - dotenv/config loads environment variables from .env.local FIRST
  // - dd-trace/initialize.mjs then initializes the tracer with those env vars
  // This ensures dd-trace loads BEFORE Next.js with proper configuration
  // All Datadog configuration is read from environment variables (DD_LLMOBS_*, DD_SITE, DD_API_KEY, etc.)

  registerOTel({ serviceName: "windsurf-dd-demo" });
}
```

---

## LLM Observability Setup

### Enable Telemetry in AI SDK Calls

For `streamText` and `generateText` calls, add the `experimental_telemetry` option:

```typescript
import { streamText } from "ai";
import { myProvider } from "@/lib/ai/providers";

const result = streamText({
  model: myProvider.languageModel("gpt-4"),
  messages: [...],
  experimental_telemetry: {
    isEnabled: true,           // Enable telemetry
    functionId: "stream-text", // Unique identifier for this call
  },
});
```

```typescript
import { generateText } from "ai";

const { text } = await generateText({
  model: myProvider.languageModel("gpt-4"),
  prompt: "Say hello",
  experimental_telemetry: {
    isEnabled: true,
    functionId: "generate-title",
  },
});
```

### What Gets Tracked

When telemetry is enabled, Datadog automatically captures:

- **Workflow spans**: `ai.generateText`, `ai.streamText`
- **LLM spans**: `ai.generateText.doGenerate`
- **HTTP requests**: API calls to LLM providers (OpenAI, Google, etc.)
- **Metrics**:
  - Input tokens
  - Output tokens
  - Total tokens
  - Latency
  - Model name and provider
  - Request/response content (configurable)

---

## Verification

### Test with a Simple Script

Create a test file `test-dd-trace.js`:

```javascript
// Run with: DOTENV_CONFIG_PATH=.env.local node --require dotenv/config --require dd-trace/init test-dd-trace.js

const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test() {
  console.log('Testing Datadog instrumentation...');
  
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
```

Run the test:
```bash
DOTENV_CONFIG_PATH=.env.local node --require dotenv/config --require dd-trace/init test-dd-trace.js
```

### Check Datadog Dashboard

1. Go to your Datadog dashboard: `https://app.{your-site}.datadoghq.com/`
2. Navigate to **APM** → **Services**
3. Look for your service (e.g., `windsurf-dd-demo`)
4. Navigate to **LLM Observability** (left sidebar)
5. You should see traces appear within 10-15 seconds

### Expected Console Output

```
Configuring LLMObsSpanWriter to https://llmobs-intake.us3.datadoghq.com/api/v2/llmobs
[LLMObs] Enabled LLM Observability with configuration: { agentlessEnabled: true, enabled: true, mlApp: 'windsurf-dd-demo' }
Application instrumentation bootstrapping complete
Testing Datadog instrumentation...
Result: Hello!
✅ Test completed - check Datadog dashboard in 10-15 seconds
```

---

## Troubleshooting

### Issue: "ai is not defined" or module resolution errors

**Cause**: The AI SDK packages are marked as external but Next.js can't resolve them at runtime.

**Solution**: 
- Ensure `node_modules` is present and packages are installed
- Use `serverComponentsExternalPackages` in `next.config.ts` instead of only webpack externals
- Restart your dev server after config changes

### Issue: No traces appearing in Datadog

**Checklist**:
1. ✅ Verify `DD_API_KEY` is correct
2. ✅ Verify `DD_SITE` matches your Datadog account
3. ✅ Check `DD_LLMOBS_ENABLED=1` and `DD_LLMOBS_AGENTLESS_ENABLED=1`
4. ✅ Confirm `experimental_telemetry.isEnabled: true` in AI SDK calls
5. ✅ Check server logs for Datadog initialization messages
6. ✅ Enable debug mode: `DD_TRACE_DEBUG=true`

### Issue: Traces work in test file but not in Next.js app

**Cause**: AI SDK packages are being bundled by webpack.

**Solution**:
- Review the [Next.js Configuration](#nextjs-configuration-for-bundling) section
- Ensure all AI SDK packages are in `serverComponentsExternalPackages`
- Restart dev server: `pnpm dev`

### Issue: "graphql" errors from dd-trace

**Solution**: Add graphql fallback in webpack config (already included in the config above):

```typescript
config.resolve.fallback = {
  ...config.resolve.fallback,
  graphql: false,
};
```

### Debug Mode

Enable debug logging to see what's happening:

```env
DD_TRACE_DEBUG=true
```

This will output detailed logs about:
- Tracer initialization
- Instrumented modules
- Spans being created
- Data being sent to Datadog

---

## References

### Official Datadog Documentation

- [Node.js Auto-Instrumentation](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/nodejs/)
- [LLM Observability Setup](https://docs.datadoghq.com/llm_observability/setup/)
- [LLM Observability Auto-Instrumentation](https://docs.datadoghq.com/llm_observability/instrumentation/auto_instrumentation/)
- [Node.js Tracing Configuration](https://docs.datadoghq.com/tracing/trace_collection/library_config/nodejs/)
- [Bundling and Serverless](https://docs.datadoghq.com/serverless/guide/serverless_tracing_and_bundlers/)

### Key Concepts

- **Auto-instrumentation**: Datadog automatically traces library calls without code changes
- **Agentless mode**: Send traces directly to Datadog without a local agent
- **Unified Service Tagging**: Use `DD_SERVICE`, `DD_ENV`, `DD_VERSION` for consistent tagging
- **ESM vs CommonJS**: Use `--import dd-trace/initialize.mjs` for ESM, `--require dd-trace/init` for CommonJS
- **Bundler compatibility**: LLM libraries must be external for instrumentation to work

### Environment Variable Reference

Full list: [Configuring the Node.js Tracing Library](https://docs.datadoghq.com/tracing/trace_collection/library_config/nodejs/)

### Getting Help

- [Datadog Support](https://www.datadoghq.com/support/)
- [Datadog Community Slack](https://chat.datadoghq.com/)
- [dd-trace GitHub Issues](https://github.com/DataDog/dd-trace-js/issues)

---

## Summary Checklist

- [ ] Install `dd-trace` package
- [ ] Configure environment variables in `.env.local`
- [ ] Update `next.config.ts` with `serverComponentsExternalPackages`
- [ ] Update `package.json` scripts with NODE_OPTIONS
- [ ] Add `experimental_telemetry` to AI SDK calls
- [ ] Test with simple script
- [ ] Verify traces in Datadog dashboard
- [ ] Remove debug logging in production

---

**Last Updated**: Based on Datadog documentation as of October 2024
