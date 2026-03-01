export async function askPersona({ persona, question, model = "gpt-5.3-codex" }) {
  await new Promise((resolve) => setTimeout(resolve, 320));

  const lower = question.toLowerCase();
  const matched = persona.facts.filter((x) =>
    lower.split(/[\s,，。？！?]+/).some((k) => k && x.toLowerCase().includes(k)),
  );
  const refs = matched.length ? matched.slice(0, 2) : persona.facts.slice(0, 2);

  const answer = `${persona.voice}。你问到“${question}”，如果从我的经历出发，我会这样看：${persona.templateA} ${persona.templateB}`;

  return {
    answer,
    refs,
    meta: {
      model,
      ts: Date.now(),
    },
  };
}
