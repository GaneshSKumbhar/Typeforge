// ── Test View: Toolbar + typing area + results ──

import { state, saveSettings } from '../store.js';
import { initEngine, restart, focus, place, handleInput, handleKeydown, isDone, setOnFinish, weakLetters, modeKey, modeLabel } from '../engine.js';
import { syncUser } from '../firebase.js';

let testKeyHandler = null;
let testResizeHandler = null;

export function applyLook() {
  const S = state.S;
  const r = document.documentElement.style;
  S.accent ? r.setProperty("--accent", S.accent) : r.removeProperty("--accent");
  r.setProperty("--fs", (S.fs || 24) + "px");
  const c = document.getElementById("caret");
  if (c) c.className = "caret " + (S.caret || "line");
  const live = document.getElementById("live-stats");
  if (live) live.style.display = S.live === false ? "none" : "";
  place();
}

export function renderTest(container) {
  container.innerHTML = `
    <div class="view-content">
      <!-- Test Area -->
      <div id="test-area">
        <div class="toolbar" id="toolbar">
          <div class="group" id="grp-opts">
            <button data-o="punct">punctuation</button>
            <button data-o="nums">numbers</button>
            <button data-o="ghost" class="on">ghost</button>
          </div>
          <div class="sep" id="sep-opts"></div>
          <div class="group" id="grp-mode">
            <button data-m="time" class="on">time</button>
            <button data-m="words">words</button>
            <button data-m="code">code</button>
            <button data-m="weak">weak keys</button>
          </div>
          <div class="sep" id="sep-amt"></div>
          <div class="group" id="grp-amt"></div>
        </div>

        <div class="live-stats" id="live-stats">
          <span id="lt">30</span>
          <span><span id="lw">0</span><small>wpm</small></span>
          <span><span id="la">100</span><small>%</small></span>
        </div>

        <div class="typing-area blur" id="typing-area" tabindex="0" aria-label="Typing area">
          <div class="typing-inner" id="typing-inner"></div>
          <div class="ghost-caret" id="ghost-caret" hidden></div>
          <div class="caret" id="caret"></div>
        </div>

    <input class="hidden-input" id="hidden-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Typing input" inputmode="text">

        <div class="typing-message" id="typing-msg"></div>
        <div class="typing-hint">
          <kbd>tab</kbd> or <kbd>esc</kbd> restart &nbsp;
          <kbd>ctrl</kbd>+<kbd>backspace</kbd> delete word
        </div>
      </div>

      <!-- Results -->
      <div class="results" id="results">
        <div class="results-hero">
          <div class="stat-main">
            <b id="res-wpm">0</b>
            <span>wpm <em id="res-pb"></em></span>
          </div>
          <div class="stat-main stat-acc">
            <b id="res-acc">0%</b>
            <span>accuracy</span>
          </div>
        </div>

        <div class="stats-grid" id="res-stats"></div>

        <div class="chart-container">
          <svg id="res-chart" viewBox="0 0 600 180" preserveAspectRatio="none"
               role="img" aria-label="Words per minute over time"></svg>
        </div>

        <div class="results-actions">
          <button class="btn-primary" id="btn-again">Next test</button>
          <button class="btn-secondary" id="btn-weak">Practice weak keys</button>
        </div>
      </div>
    </div>
  `;

  // Bind engine
  const refs = {
    area: document.getElementById("typing-area"),
    inner: document.getElementById("typing-inner"),
    caret: document.getElementById("caret"),
    ghost: document.getElementById("ghost-caret"),
    hid: document.getElementById("hidden-input"),
    live: document.getElementById("live-stats"),
    lt: document.getElementById("lt"),
    lw: document.getElementById("lw"),
    la: document.getElementById("la"),
    msg: document.getElementById("typing-msg")
  };

  initEngine(refs);

  // Events
  refs.area.addEventListener("click", focus);
  refs.hid.addEventListener("blur", () => { if (!isDone()) refs.area.classList.add("blur"); });
  refs.hid.addEventListener("input", handleInput);

  const isTypingOK = (e) => {
    const currentView = (location.hash || "#/test").slice(2);
    return currentView === "test" && (e.target.id === "hidden-input" || !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName));
  };

  if (testKeyHandler) document.removeEventListener("keydown", testKeyHandler);
  testKeyHandler = e => handleKeydown(e, isTypingOK);
  document.addEventListener("keydown", testKeyHandler);
  // Toolbar
  const toolbar = document.getElementById("toolbar");
  toolbar.addEventListener("click", e => {
    const S = state.S;
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.m) {
      S.mode = b.dataset.m;
      if (S.mode === "time" && ![15, 30, 60, 120].includes(S.amt)) S.amt = 30;
      if (S.mode === "words" && ![10, 25, 50].includes(S.amt)) S.amt = 25;
    }
    if (b.dataset.a) S.amt = +b.dataset.a;
    if (b.dataset.o) S[b.dataset.o] = !S[b.dataset.o];
    saveSettings();
    applyLook();
    clearTimeout(window._sv);
    window._sv = setTimeout(syncUser, 800);
    buildToolbar();
    restart();
  });

  document.getElementById("btn-again").onclick = () => {
    document.getElementById("test-area").style.display = "";
    document.getElementById("results").classList.remove("visible");
    restart();
  };

  document.getElementById("btn-weak").onclick = () => {
    state.S.mode = "weak";
    saveSettings();
    document.getElementById("test-area").style.display = "";
    document.getElementById("results").classList.remove("visible");
    buildToolbar();
    restart();
  };

  // Result callback
  setOnFinish(showResults);

  // Resize
  if (testResizeHandler) {
    window.removeEventListener("resize", testResizeHandler);
    window.visualViewport?.removeEventListener("resize", testResizeHandler);
  }
  testResizeHandler = place;
  window.addEventListener("resize", testResizeHandler);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", testResizeHandler);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

  // Init
  buildToolbar();
  applyLook();
  restart();
}

function buildToolbar() {
  const S = state.S;
  const amts = S.mode === "time" ? [15, 30, 60, 120] : S.mode === "words" ? [10, 25, 50] : [];
  document.getElementById("grp-amt").innerHTML = amts.map(a =>
    `<button data-a="${a}" class="${a === S.amt ? "on" : ""}">${a}</button>`
  ).join("");
  document.getElementById("sep-amt").style.display = amts.length ? "" : "none";

  document.querySelectorAll("#grp-opts [data-o]").forEach(b => {
    b.style.display = (b.dataset.o !== "ghost" && !amts.length) ? "none" : "";
    b.classList.toggle("on", !!S[b.dataset.o]);
  });
  document.querySelectorAll("#grp-mode button").forEach(b => {
    b.classList.toggle("on", b.dataset.m === S.mode);
  });
}

function countUp(el, to, suf = "") {
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) { el.textContent = to + suf; return; }
  const t = performance.now();
  (function f(n) {
    const p = Math.min(1, (n - t) / 800);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
    if (p < 1) requestAnimationFrame(f);
  })(t);
}

function showResults(data) {
  const { wpm, raw, acc, cons, isPB, prev, el, correct, errs, total, samples } = data;

  document.getElementById("test-area").style.display = "none";
  const res = document.getElementById("results");
  res.classList.add("visible");

  countUp(document.getElementById("res-wpm"), Math.round(wpm));
  countUp(document.getElementById("res-acc"), Math.round(acc), "%");

  document.getElementById("res-pb").innerHTML = isPB && prev
    ? '<span class="pb-badge">New Personal Best</span>'
    : isPB ? '<span class="pb-badge">First Score Saved</span>' : "";

  document.getElementById("res-stats").innerHTML = [
    ["raw", Math.round(raw)],
    ["consistency", Math.round(cons) + "%"],
    ["characters", correct + " / " + errs + " wrong"],
    ["time", el.toFixed(1) + "s"],
    ["test", modeLabel()]
  ].map(a => `<div class="stat-card"><span>${a[0]}</span><b>${a[1]}</b></div>`).join("");

  renderChart(samples);

  document.getElementById("btn-weak").style.display = weakLetters().length ? "" : "none";
  document.getElementById("btn-again").focus();
}

function renderChart(samples) {
  const svg = document.getElementById("res-chart");
  const n = samples.length;
  if (n < 2) {
    svg.innerHTML = '<text x="300" y="95" text-anchor="middle" fill="var(--fg-dim)" font-size="13" font-family="var(--font-mono)">Run a longer test to see your pace over time</text>';
    return;
  }
  const pts = samples.map((s, j) => s.c / 5 / ((j + 1) / 60));
  const max = Math.max(...pts) * 1.15 || 1;
  const X = j => 30 + j * (560 / (n - 1));
  const Y = v => 160 - v / max * 140;

  let line = pts.map((v, j) => `${X(j)},${Y(v)}`).join(" ");
  let dots = samples.map((s, j) =>
    s.e > (samples[j - 1] ? samples[j - 1].e : 0)
      ? `<circle cx="${X(j)}" cy="${Y(pts[j])}" r="4" fill="var(--error)"/>`
      : ""
  ).join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="30" y1="160" x2="590" y2="160" stroke="var(--line)"/>
    <polygon points="30,160 ${line} ${X(n - 1)},160" fill="url(#chartGrad)"/>
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
    ${dots}
    <text x="4" y="24" fill="var(--fg-dim)" font-size="11" font-family="var(--font-mono)">${Math.round(max)}</text>
    <text x="4" y="164" fill="var(--fg-dim)" font-size="11" font-family="var(--font-mono)">0</text>
  `;
}

export function reenterTest() {
  const testArea = document.getElementById("test-area");
  const results = document.getElementById("results");
  if (testArea) testArea.style.display = "";
  if (results) results.classList.remove("visible");
  if (!isDone()) { place(); focus(); }
}
