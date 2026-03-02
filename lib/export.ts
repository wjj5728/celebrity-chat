type ExportMessage = { role: "user" | "assistant"; text: string };

type ExportInput = {
  personaName: string;
  model: string;
  messages: ExportMessage[];
};

export function buildMarkdownTranscript(input: ExportInput) {
  const lines: string[] = [];
  lines.push(`# 名人对话记录`);
  lines.push("");
  lines.push(`- 角色：${input.personaName}`);
  lines.push(`- 模型：${input.model}`);
  lines.push(`- 时间：${new Date().toLocaleString("zh-CN")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  input.messages.forEach((m, idx) => {
    const speaker = m.role === "user" ? "用户" : input.personaName;
    lines.push(`## ${idx + 1}. ${speaker}`);
    lines.push("");
    lines.push(m.text.trim());
    lines.push("");
  });

  return lines.join("\n");
}
