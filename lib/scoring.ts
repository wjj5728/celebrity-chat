type RefItem = { text: string; source: string };

export function scoreAnswer(answer: string, refs: RefItem[]) {
  const lengthScore = Math.min(40, Math.max(10, Math.floor(answer.length / 6)));
  const refScore = Math.min(40, refs.length * 20);
  const groundedHint = /基于|资料|来源|事实/.test(answer) ? 20 : 10;
  const total = Math.min(100, lengthScore + refScore + groundedHint);

  if (total >= 80) return { total, level: "高" };
  if (total >= 60) return { total, level: "中" };
  return { total, level: "低" };
}
