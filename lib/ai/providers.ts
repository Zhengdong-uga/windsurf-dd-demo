import { openai } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Use direct OpenAI providers for Datadog LLM Observability auto-instrumentation
// customProvider breaks telemetry chain, so we define models directly
const gpt4o = openai("gpt-4o");
const gpt4oMini = openai("gpt-4o-mini");
const o1mini = openai("o1-mini");

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
          case "artifact-model":
          case "chat-model-gpt-4o":
            return gpt4o;
          case "chat-model-reasoning":
            return wrapLanguageModel({
              model: o1mini,
              middleware: extractReasoningMiddleware({ tagName: "think" }),
            });
          case "title-model":
          case "chat-model-gpt-4o-mini":
            return gpt4oMini;
          default:
            return gpt4o;
        }
      },
    };
