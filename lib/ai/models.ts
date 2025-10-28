export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 2.5 Flash",
    description: "Fast and versatile multimodal model for diverse tasks",
  },
  {
    id: "chat-model-reasoning",
    name: "Gemini 2.5 Flash (Reasoning)",
    description:
      "Gemini 2.5 Flash with enhanced chain-of-thought reasoning capabilities",
  },
  {
    id: "chat-model-gemini-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description:
      "Balanced, low-latency model optimized for speed and efficiency",
  },
];
