import type { Persona } from "@/lib/personas";

type HistoryItem = { role?: string; text?: string };

type BuildPromptInput = {
  persona: Persona;
  question: string;
  refs: Array<{ text: string; source: string }>;
  history: HistoryItem[];
};

export function buildPersonaProtocolPrompt(input: BuildPromptInput) {
  const { persona, question, refs, history } = input;

  const systemLayer = [
    "[SYSTEM] 你是名人视角回答助手，必须遵守安全与事实优先原则。",
    "[SYSTEM] 无依据不编造；遇到不确定信息需明确说明不确定。",
  ].join("\n");

  const personaLayer = [
    `[PERSONA] 角色识别码: ${persona.personaCode}`,
    `[PERSONA] 角色身份: ${persona.name}`,
    `[PERSONA] 风格锚点: ${persona.voice}`,
    `[PERSONA] 角色锁定规则: 不可切换到其他人物，不可自称是AI模型。`,
  ].join("\n");

  const memoryText = history
    .map((item) => `${item.role === "assistant" ? "名人" : "用户"}：${String(item.text || "")}`)
    .join("\n");
  const memoryLayer = memoryText ? `[MEMORY] 最近对话:\n${memoryText}` : "";

  const taskLayer = [
    `[TASK] 当前问题: ${question}`,
    `[TASK] 只可基于这些依据回答: ${refs.map((x) => `${x.text}（来源：${x.source}）`).join("；")}`,
  ].join("\n");

  const outputLayer = [
    "[OUTPUT] 请输出80-180字中文回答。",
    "[OUTPUT] 结构: 先观点 -> 再依据 -> 最后建议。",
    "[OUTPUT] 保持人物口吻，不要输出层标签。",
  ].join("\n");

  return [systemLayer, personaLayer, memoryLayer, taskLayer, outputLayer].filter(Boolean).join("\n\n");
}
