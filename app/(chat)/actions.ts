"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { myProvider } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  try {
    const { text: title } = await generateText({
      model: myProvider.languageModel("title-model"),
      system: `
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(message),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "generate-title",
      },
    });

    return title;
  } catch (_err) {
    // Fallback: derive a simple local title from the message content
    try {
      const raw = typeof message?.content === "string" ? message.content : JSON.stringify(message?.content ?? "");
      const compact = raw.replace(/\s+/g, " ").trim();
      const sliced = compact.slice(0, 80);
      return sliced.length > 0 ? sliced : "New Chat";
    } catch {
      return "New Chat";
    }
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
