import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

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
  : (() => {
      const geminiFlash = google("gemini-2.5-flash");
      const geminiFlashLite = google("gemini-2.5-flash-lite");

      return customProvider({
        languageModels: {
          "chat-model": geminiFlash,
          "chat-model-reasoning": wrapLanguageModel({
            model: geminiFlash,
            middleware: extractReasoningMiddleware({ tagName: "think" }),
          }),
          "title-model": geminiFlashLite,
          "artifact-model": geminiFlash,
          "chat-model-gemini-flash": geminiFlash,
          "chat-model-gemini-flash-lite": geminiFlashLite,
        },
      });
    })();
