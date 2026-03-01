import type { Persona } from "@/lib/personas";

export function retrieveRelevantChunks(persona: Persona, question: string, topK = 2) {
  const chunks = persona.facts.map((fact, idx) => ({
    id: `${persona.id}-fact-${idx + 1}`,
    text: fact,
    source: persona.sources[idx] || "公开资料整理",
  }));

  const tokens = question.toLowerCase().split(/[\s,，。？！?]+/).filter(Boolean);
  const scored = chunks.map((chunk) => {
    const lower = chunk.text.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (token && lower.includes(token)) score += 1;
    }
    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.filter((x) => x.score > 0).slice(0, topK);
  return selected.length ? selected : scored.slice(0, topK);
}

export function buildGroundedReply(persona: Persona, question: string, refs: Array<{ text: string }>) {
  const evidence = refs.map((r) => r.text).join("；");
  return `${persona.voice}。你问到“${question}”，基于已知资料：${evidence}。${persona.templateA} ${persona.templateB}`;
}
