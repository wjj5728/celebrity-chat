const BLOCK_PATTERNS = [
  /教我(制作|制造).*(炸弹|爆炸物)/i,
  /怎么(自杀|自残)/i,
  /仇恨|种族清洗|恐怖袭击/i,
];

const RISK_PATTERNS = [/稳赚|必赚|内幕/i, /处方药|剂量|替代医生/i, /法律责任|规避监管/i];

export function moderateQuestion(input: string) {
  const text = String(input || "").trim();
  if (!text) return { level: "ok" as const, reason: "empty" };

  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.test(text)) return { level: "block" as const, reason: "涉及高风险或违法内容" };
  }

  for (const pattern of RISK_PATTERNS) {
    if (pattern.test(text)) return { level: "warn" as const, reason: "涉及高风险建议，需谨慎" };
  }

  return { level: "ok" as const, reason: "通过" };
}

export function withSafetySuffix(level: "ok" | "warn" | "block") {
  if (level === "warn") {
    return "\n\n安全提示：该问题可能涉及高风险决策，请务必结合专业意见审慎判断。";
  }
  return "";
}
