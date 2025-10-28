import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Use direct Google providers for Datadog LLM Observability auto-instrumentation
// customProvider breaks telemetry chain, so we define models directly
const geminiFlash = google("gemini-2.5-flash");
const geminiFlashLite = google("gemini-2.5-flash-lite");

// Create a simple provider interface that returns the models directly
// This maintains API compatibility while enabling Datadog auto-instrumentation
export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, reasoningModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
        },
      });
    })()
  : {
      languageModel: (id: string) => {
        switch (id) {
          case "chat-model":
          case "chat-model-gemini-flash":
          case "artifact-model":
            return geminiFlash;
          case "chat-model-reasoning":
            return wrapLanguageModel({
              model: geminiFlash,
              middleware: extractReasoningMiddleware({ tagName: "think" }),
            });
          case "title-model":
          case "chat-model-gemini-flash-lite":
            return geminiFlashLite;
          default:
            return geminiFlash;
        }
      },
    };
