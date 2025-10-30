export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-4o",
    description: "OpenAI flagship multimodal model for diverse tasks",
  },
  {
    id: "chat-model-reasoning",
    name: "o1-mini (Reasoning)",
    description: "OpenAI lightweight reasoning model for chain-of-thought tasks",
  },
  {
    id: "chat-model-gemini-flash-lite",
    name: "GPT-4o-mini",
    description: "OpenAI fast, low-latency model optimized for speed and cost",
  },
];
