"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { personas } from "@/lib/personas";

type Msg = { role: "user" | "assistant"; text: string };

type RefItem = { text: string; source: string };

const CHAT_STATE_KEY = "celebrity-chat-state-v07";

export default function HomePage() {
  const [personaId, setPersonaId] = useState(personas[0].id);
  const [model, setModel] = useState("gpt-5.3-codex");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: `你好，我将以${personas[0].name}的风格与你交流。` },
  ]);
  const [refs, setRefs] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaInfo, setMetaInfo] = useState<{ level?: string; latencyMs?: number }>({});

  const current = useMemo(() => personas.find((p) => p.id === personaId) || personas[0], [personaId]);

  useEffect(() => {
    const raw = window.localStorage.getItem(CHAT_STATE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as {
        personaId?: string;
        model?: string;
        messages?: Msg[];
        refs?: RefItem[];
        metaInfo?: { level?: string; latencyMs?: number };
      };

      if (saved.personaId && personas.some((p) => p.id === saved.personaId)) {
        setPersonaId(saved.personaId);
      }
      if (saved.model) setModel(saved.model);
      if (saved.messages && saved.messages.length) setMessages(saved.messages);
      if (saved.refs) setRefs(saved.refs);
      if (saved.metaInfo) setMetaInfo(saved.metaInfo);
    } catch {
      window.localStorage.removeItem(CHAT_STATE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      CHAT_STATE_KEY,
      JSON.stringify({ personaId, model, messages, refs, metaInfo }),
    );
  }, [personaId, model, messages, refs, metaInfo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, personaId, model }),
    });
    const data = await response.json();

    setMessages((prev) => [...prev, { role: "assistant", text: `${data.answer}\n\n（模型：${data.meta?.model || model}）` }]);
    setRefs(data.refs || []);
    setMetaInfo({ level: data.level, latencyMs: data.meta?.latencyMs });
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_320px]">
        <aside className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-xl font-semibold">名人对话实验室</h1>
          <p className="mt-2 text-sm text-slate-400">v0.7.0 会话持久化（本地历史 + 一键清空）</p>
          <div className="mt-4 space-y-2">
            {personas.map((p) => (
              <button
                key={p.id}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${personaId === p.id ? "border-cyan-400 bg-slate-800" : "border-slate-700 bg-slate-950"}`}
                onClick={() => {
                  setPersonaId(p.id);
                  setMessages([{ role: "assistant", text: `你好，我将以${p.name}的风格与你交流。` }]);
                  setRefs([]);
                  setMetaInfo({});
                }}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-400">{p.tag}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{current.name}（角色视角）</h2>
              <p className="text-sm text-slate-400">{current.summary}</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              onClick={() => {
                const resetMessages: Msg[] = [{ role: "assistant", text: `你好，我将以${current.name}的风格与你交流。` }];
                setMessages(resetMessages);
                setRefs([]);
                setMetaInfo({});
              }}
            >
              清空会话
            </button>
          </header>

          <div className="mt-4 h-[56vh] overflow-auto space-y-3 pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] rounded-xl border px-3 py-2 text-sm leading-6 whitespace-pre-wrap ${m.role === "user" ? "ml-auto border-cyan-600 bg-cyan-900/30" : "border-slate-700 bg-slate-800"}`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="text-sm text-slate-400">思考中...</div>}
          </div>

          <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm"
            >
              <option value="gpt-5.3-codex">GPT 5.3 Codex</option>
              <option value="qwen-coder">Qwen Coder</option>
            </select>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入你的问题..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">发送</button>
          </form>
        </section>

        <aside className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h3 className="text-base font-semibold">人物资料</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
            {current.facts.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>

          <h3 className="mt-4 text-base font-semibold">回答依据</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
            {refs.length === 0 && <li>发送问题后显示本轮依据</li>}
            {refs.map((r, idx) => (
              <li key={idx}>{r.text}（来源：{r.source}）</li>
            ))}
          </ul>

          <h3 className="mt-4 text-base font-semibold">运行指标</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>安全等级：{metaInfo.level || "-"}</li>
            <li>响应延迟：{typeof metaInfo.latencyMs === "number" ? `${metaInfo.latencyMs} ms` : "-"}</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
