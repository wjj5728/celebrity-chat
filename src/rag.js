export function buildChunks(persona) {
  return persona.facts.map((fact, idx) => ({
    id: `${persona.id}-fact-${idx + 1}`,
    text: fact,
    source: persona.sources?.[idx] || "公开资料整理",
  }));
}

export function retrieveRelevantChunks(persona, question, topK = 2) {
  const chunks = buildChunks(persona);
  const tokens = question.toLowerCase().split(/[\s,，。？！?]+/).filter(Boolean);

  const scored = chunks.map((c) => {
    const lower = c.text.toLowerCase();
    let score = 0;
    tokens.forEach((t) => {
      if (lower.includes(t)) score += 1;
    });
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.filter((x) => x.score > 0).slice(0, topK);
  return selected.length ? selected : scored.slice(0, topK);
}

export function buildGroundedReply({ persona, question, refs }) {
  const evidence = refs.map((r) => r.text).join("；");
  return `${persona.voice}。你问到“${question}”，基于已知资料：${evidence}。${persona.templateA} ${persona.templateB}`;
}
