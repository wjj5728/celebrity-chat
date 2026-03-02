import { NextResponse } from "next/server";

import { personas } from "@/lib/personas";
import { buildGroundedReply, retrieveRelevantChunks } from "@/lib/rag";
import { moderateQuestion, withSafetySuffix } from "@/lib/safety";
import { generateAnswer } from "@/lib/model";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = await request.json().catch(() => null);
  const question = String(body?.question || "").trim();
  const personaId = String(body?.personaId || "").trim();
  const model = String(body?.model || "gpt-5.3-codex").trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];

  if (!question || !personaId) {
    return NextResponse.json({ error: "缺少问题或名人ID" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") || "local";
  const limitMax = Number(process.env.RATE_LIMIT_MAX || 12);
  const limitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const rate = checkRateLimit(ip, limitMax, limitWindowMs);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "请求过于频繁，请稍后再试",
        retryAfterMs: rate.retryAfterMs,
      },
      { status: 429 },
    );
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
      meta: { model, ts: Date.now(), latencyMs: Date.now() - startedAt },
    });
  }

  const refs = retrieveRelevantChunks(persona, question, 2);
  const groundedDraft = buildGroundedReply(persona, question, refs);

  const historyText = history
    .map((item: { role?: string; text?: string }) => `${item.role === "assistant" ? "名人" : "用户"}：${String(item.text || "")}`)
    .join("\n");

  const prompt = [
    `你现在扮演：${persona.name}`,
    `人物风格：${persona.voice}`,
    historyText ? `最近对话：\n${historyText}` : "",
    `当前问题：${question}`,
    `请严格基于以下事实回答，不要编造：${refs.map((x) => `${x.text}（来源：${x.source}）`).join("；")}`,
    "输出要求：自然中文、保持人物口吻、80-180字。",
  ]
    .filter(Boolean)
    .join("\n");

  const generated = await generateAnswer({ prompt, model });
  const answer = (generated.provider === "mock" ? groundedDraft : generated.text) + withSafetySuffix(moderation.level);

  return NextResponse.json({
    blocked: false,
    level: moderation.level,
    answer,
    refs,
    meta: {
      model,
      provider: generated.provider,
      ts: Date.now(),
      latencyMs: Date.now() - startedAt,
    },
  });
}
