import { NextResponse } from "next/server";

import { personas } from "@/lib/personas";
import { buildGroundedReply, retrieveRelevantChunks } from "@/lib/rag";
import { moderateQuestion, withSafetySuffix } from "@/lib/safety";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = String(body?.question || "").trim();
  const personaId = String(body?.personaId || "").trim();
  const model = String(body?.model || "gpt-5.3-codex").trim();

  if (!question || !personaId) {
    return NextResponse.json({ error: "缺少问题或名人ID" }, { status: 400 });
  }

  const persona = personas.find((p) => p.id === personaId);
  if (!persona) {
    return NextResponse.json({ error: "名人不存在" }, { status: 404 });
  }

  const moderation = moderateQuestion(question);
  if (moderation.level === "block") {
    return NextResponse.json({
      blocked: true,
      level: "block",
      reason: moderation.reason,
      answer: `这个问题我不能直接回答：${moderation.reason}。你可以换个安全、学习型问法。`,
      refs: [],
      meta: { model, ts: Date.now() },
    });
  }

  const refs = retrieveRelevantChunks(persona, question, 2);
  const answer = buildGroundedReply(persona, question, refs) + withSafetySuffix(moderation.level);

  return NextResponse.json({
    blocked: false,
    level: moderation.level,
    answer,
    refs,
    meta: { model, ts: Date.now() },
  });
}
