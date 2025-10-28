import { registerOTel } from "@vercel/otel";

export function register() {
  // Note: Datadog tracer is initialized via NODE_OPTIONS="--require dotenv/config --import dd-trace/initialize.mjs"
  // - dotenv/config loads environment variables from .env.local FIRST
  // - dd-trace/initialize.mjs then initializes the tracer with those env vars
  // This ensures dd-trace loads BEFORE Next.js with proper configuration
  // All Datadog configuration is read from environment variables (DD_LLMOBS_*, DD_SITE, DD_API_KEY, etc.)

  registerOTel({ serviceName: "windsurf-dd-demo" });
}
