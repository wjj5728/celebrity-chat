export type MessageRole = "user" | "assistant";

export type SessionMessage = {
  role: MessageRole;
  text: string;
};

export function calcSessionStats(messages: SessionMessage[]) {
  const userCount = messages.filter((m) => m.role === "user").length;
  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  const totalChars = messages.reduce((sum, m) => sum + m.text.length, 0);

  return {
    rounds: Math.min(userCount, assistantCount),
    userCount,
    assistantCount,
    totalChars,
  };
}
