import { personas } from "./personas.js";

const personaListEl = document.getElementById("persona-list");
const chatLogEl = document.getElementById("chat-log");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
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
    li.textContent = x;
    citationsEl.appendChild(li);
  });
}

function renderFacts(persona) {
  factsEl.innerHTML = "";
  persona.facts.forEach((x) => {
    const li = document.createElement("li");
    li.textContent = x;
    factsEl.appendChild(li);
  });
}

function buildReply(persona, question) {
  const lower = question.toLowerCase();
  const matched = persona.facts.filter((x) => lower.split(/[\s,，。？！?]+/).some((k) => k && x.toLowerCase().includes(k)));
  const refs = matched.length ? matched.slice(0, 2) : persona.facts.slice(0, 2);

  const answer = `${persona.voice}。你问到“${question}”，如果从我的经历出发，我会这样看：${persona.templateA} ${persona.templateB}`;

  return { answer, refs };
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
  setCitations(["请选择问题后显示本轮依据"]);
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

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = inputEl.value.trim();
  if (!q || !current) return;

  appendMessage("user", q);
  const { answer, refs } = buildReply(current, q);
  appendMessage("assistant", answer);
  setCitations(refs);
  inputEl.value = "";
});

selectPersona(personas[0].id);
