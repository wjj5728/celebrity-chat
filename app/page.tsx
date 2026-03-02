"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { buildMarkdownTranscript } from "@/lib/export";
import { personas } from "@/lib/personas";
import { scoreAnswer } from "@/lib/scoring";

type Msg = { role: "user" | "assistant"; text: string };

type RefItem = { text: string; source: string };

const CHAT_STATE_KEY = "celebrity-chat-state-v07";

export default function HomePage() {
  const [personaId, setPersonaId] = useState(personas[0].id);
  const [model, setModel] = useState("gpt-5.3-codex");
  const [question, setQuestion] = useState("");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("全部");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: `你好，我将以${personas[0].name}的风格与你交流。` },
  ]);
  const [refs, setRefs] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaInfo, setMetaInfo] = useState<{ level?: string; latencyMs?: number; provider?: string; score?: number; scoreLevel?: string }>({});
  const [serviceStatus, setServiceStatus] = useState<{ provider?: string; ok?: boolean }>({});

  const current = useMemo(() => personas.find((p) => p.id === personaId) || personas[0], [personaId]);
  const tags = useMemo(() => ["全部", ...Array.from(new Set(personas.map((p) => p.tag.split("/")[0].trim())))], []);
  const filteredPersonas = useMemo(() => {
    return personas.filter((p) => {
      const hitTag = tagFilter === "全部" || p.tag.includes(tagFilter);
      const key = search.trim().toLowerCase();
      const hitSearch = !key || p.name.toLowerCase().includes(key) || p.tag.toLowerCase().includes(key);
      return hitTag && hitSearch;
    });
  }, [search, tagFilter]);

  useEffect(() => {
    const raw = window.localStorage.getItem(CHAT_STATE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as {
        personaId?: string;
        model?: string;
        messages?: Msg[];
        refs?: RefItem[];
        metaInfo?: {
          level?: string;
          latencyMs?: number;
          provider?: string;
          score?: number;
          scoreLevel?: string;
        };
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

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setServiceStatus({ ok: Boolean(data?.ok), provider: data?.modelProvider || "unknown" });
      })
      .catch(() => {
        setServiceStatus({ ok: false, provider: "offline" });
      });
  }, []);

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

    if (!response.ok) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.error ? `${data.error}${data.retryAfterMs ? `（约${Math.ceil(data.retryAfterMs / 1000)}秒后重试）` : ""}` : "请求失败，请稍后重试。",
        },
      ]);
      setLoading(false);
      return;
    }

    const assistantText = `${data.answer}\n\n（模型：${data.meta?.model || model}）`;
    const nextRefs = data.refs || [];
    const quality = scoreAnswer(assistantText, nextRefs);

    setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
    setRefs(nextRefs);
    setMetaInfo({
      level: data.level,
      latencyMs: data.meta?.latencyMs,
      provider: data.meta?.provider,
      score: quality.total,
      scoreLevel: quality.level,
    });
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_320px]">
        <aside className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-xl font-semibold">名人对话实验室</h1>
          <p className="mt-2 text-sm text-slate-400">v1.3.0 健康检查接口与模型状态展示</p>
          <p className="mt-1 text-xs text-slate-500">
            服务状态：{serviceStatus.ok ? "正常" : "异常"} / 模型源：{serviceStatus.provider || "检测中"}
          </p>
          <div className="mt-4 space-y-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索名人或标签"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 space-y-2">
            {filteredPersonas.map((p) => (
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
            {filteredPersonas.length === 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400">未找到匹配名人</div>
            )}
          </div>
        </aside>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{current.name}（角色视角）</h2>
              <p className="text-sm text-slate-400">{current.summary}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() => {
                  const markdown = buildMarkdownTranscript({
                    personaName: current.name,
                    model,
                    messages,
                  });
                  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `celebrity-chat-${current.id}-${Date.now()}.md`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                导出记录
              </button>
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
            </div>
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
            <li>模型来源：{metaInfo.provider || "-"}</li>
            <li>响应延迟：{typeof metaInfo.latencyMs === "number" ? `${metaInfo.latencyMs} ms` : "-"}</li>
            <li>回答评分：{typeof metaInfo.score === "number" ? `${metaInfo.score} / 100（${metaInfo.scoreLevel}）` : "-"}</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
