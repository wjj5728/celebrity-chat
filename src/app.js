import { personas } from "./personas.js";
import { askPersona } from "./api.js";
import { retrieveRelevantChunks, buildGroundedReply } from "./rag.js";

const personaListEl = document.getElementById("persona-list");
const chatLogEl = document.getElementById("chat-log");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
const modelSelectEl = document.getElementById("model-select");
const currentNameEl = document.getElementById("current-name");
const currentSummaryEl = document.getElementById("current-summary");
const factsEl = document.getElementById("persona-facts");
const citationsEl = document.getElementById("citations");

let current = null;

function appendMessage(role, text) {
  const item = document.createElement("div");
  item.className = `msg ${role}`;
  item.textContent = text;
  chatLogEl.appendChild(item);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

function setCitations(items) {
  citationsEl.innerHTML = "";
  items.forEach((x) => {
    const li = document.createElement("li");
    li.textContent = `${x.text}（来源：${x.source}）`;
    citationsEl.appendChild(li);
  });
}

function renderFacts(persona) {
  factsEl.innerHTML = "";
  persona.facts.forEach((x, idx) => {
    const li = document.createElement("li");
    li.textContent = `${x}（${persona.sources?.[idx] || "公开资料"}）`;
    factsEl.appendChild(li);
  });
}

function selectPersona(personaId) {
  current = personas.find((p) => p.id === personaId) || null;
  document.querySelectorAll(".persona-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === personaId);
  });

  if (!current) return;

  currentNameEl.textContent = `${current.name}（角色视角）`;
  currentSummaryEl.textContent = current.summary;
  renderFacts(current);
  citationsEl.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = "请选择问题后显示本轮依据";
  citationsEl.appendChild(li);
  chatLogEl.innerHTML = "";
  appendMessage("assistant", `你好，我将以${current.name}的风格与你交流。`);
}

personas.forEach((p) => {
  const btn = document.createElement("button");
  btn.className = "persona-btn";
  btn.dataset.id = p.id;
  btn.innerHTML = `<strong>${p.name}</strong><br><span class="muted">${p.tag}</span>`;
  btn.addEventListener("click", () => selectPersona(p.id));
  personaListEl.appendChild(btn);
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = inputEl.value.trim();
  if (!q || !current) return;

  appendMessage("user", q);
  inputEl.value = "";

  const pending = document.createElement("div");
  pending.className = "msg assistant";
  pending.textContent = "思考中...";
  chatLogEl.appendChild(pending);

  const refs = retrieveRelevantChunks(current, q, 2);
  const groundedDraft = buildGroundedReply({ persona: current, question: q, refs });

  const result = await askPersona({
    persona: current,
    question: `${q}\n\n请基于以下依据组织回答：${refs.map((x) => x.text).join("；")}`,
    model: modelSelectEl.value,
  });

  pending.textContent = `${groundedDraft}\n\n（模型：${result.meta.model}）`;
  setCitations(refs);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
});

selectPersona(personas[0].id);
