// ── Typing engine ──

import { WORDS, CODE } from './data/words.js';
import { state, saveKeys, saveHistory, savePBs, saveDays } from './store.js';
import { afterTest as fbAfterTest, syncUser } from './firebase.js';

const rnd = a => a[Math.floor(Math.random() * a.length)];

let text = "", chars = [], st = [], i = 0;
let correct = 0, total = 0, errs = 0;
let t0 = 0, tm = null, samples = [], done = false, lastSec = 0;
let weakSet = [];
let actx = null;

// DOM refs – set on init
let area, inner, caret, ghost, hid;
let liveDom, ltDom, lwDom, laDom, msgDom;

export function initEngine(refs) {
  area = refs.area; inner = refs.inner;
  caret = refs.caret; ghost = refs.ghost;
  hid = refs.hid; liveDom = refs.live;
  ltDom = refs.lt; lwDom = refs.lw; laDom = refs.la;
  msgDom = refs.msg;
}

export function isDone() { return done; }
export function getWeakSet() { return weakSet; }

export function weakLetters() {
  return Object.entries(state.K)
    .filter(([, v]) => v[0] >= 8 && v[1] > 0)
    .sort((a, b) => b[1][1] / b[1][0] - a[1][1] / a[1][0])
    .slice(0, 5).map(e => e[0]);
}

export function modeKey() {
  const S = state.S;
  return S.mode + (S.mode === "time" || S.mode === "words" ? S.amt : "")
    + (S.punct ? "p" : "") + (S.nums ? "n" : "");
}

export function modeLabel() {
  const S = state.S;
  return S.mode === "time" || S.mode === "words" ? S.mode + " " + S.amt : S.mode;
}

function gen() {
  const S = state.S;
  let n = S.mode === "time" ? 300 : S.amt, out = [];
  if (S.mode === "code") {
    const c = [...CODE].sort(() => Math.random() - 0.5).slice(0, 3);
    return c.join(" ");
  }
  let pool = WORDS;
  if (S.mode === "weak") {
    weakSet = weakLetters();
    n = 40;
    if (weakSet.length) {
      const f = WORDS.filter(w => weakSet.some(l => w.includes(l)));
      if (f.length > 5) pool = f;
    }
  }
  for (let j = 0; j < n; j++) {
    let w = rnd(pool);
    if (S.nums && Math.random() < 0.1) w = String(Math.floor(Math.random() * 9000) + 1);
    if (S.punct) {
      if (j === 0 || /[.?]$/.test(out[j - 1])) w = w[0].toUpperCase() + w.slice(1);
      const r = Math.random();
      if (r < 0.1) w += ",";
      else if (r < 0.17) w += ".";
      else if (r < 0.2) w += "?";
    }
    out.push(w);
  }
  return out.join(" ");
}

function beep(ok) {
  if (!state.S.sound) return;
  try {
    actx = actx || new AudioContext();
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = ok ? 680 : 200;
    g.gain.value = 0.04;
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + 0.025);
  } catch {}
}

// Callbacks
let onFinishCallback = null;

export function setOnFinish(fn) { onFinishCallback = fn; }

function pos(el, idx) {
  const c = chars[Math.min(idx, chars.length - 1)];
  if (!c || !area) return;
  const areaRect = area.getBoundingClientRect();
  const charRect = c.getBoundingClientRect();
  // Rectangles include wrapping, inline-block word offsets and the scrolled
  // typing viewport, unlike offsetLeft which is relative to the word itself.
  const atEnd = idx >= chars.length;
  const left = (atEnd ? charRect.right : charRect.left) - areaRect.left - area.clientLeft;
  const top = charRect.top - areaRect.top - area.clientTop;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  return top;
}

export function place() {
  if (!chars.length || !chars[0]) return;
  const c = chars[Math.min(i, chars.length - 1)];
  if (!c) return;
  const top = c.getBoundingClientRect().top - area.getBoundingClientRect().top;
  const lh = c.getBoundingClientRect().height;
  const shift = Math.max(0, top - lh);
  inner.style.transform = `translateY(-${shift}px)`;
  pos(caret, i);
}

export function focus() {
  hid.focus({ preventScroll: true });
  area.classList.remove("blur");
}

export function restart() {
  const S = state.S;
  clearInterval(tm);
  done = false; t0 = 0; i = 0;
  correct = total = errs = 0;
  samples = []; lastSec = 0;

  text = gen();
  st = new Array(text.length).fill(0);
  inner.innerHTML = "";

  text.split(" ").forEach((w, wi, arr) => {
    const d = document.createElement("div");
    d.className = "w";
    const s = wi < arr.length - 1 ? w + " " : w;
    for (const ch of s) {
      const sp = document.createElement("span");
      sp.textContent = ch === " " ? "\u00a0" : ch;
      d.appendChild(sp);
    }
    inner.appendChild(d);
  });

  chars = [...inner.querySelectorAll("span")];
  liveDom.classList.remove("show");
  ltDom.textContent = S.mode === "time" ? S.amt : "0";
  lwDom.textContent = "0";
  laDom.textContent = "100";
  msgDom.textContent = "";

  if (S.mode === "weak") {
    msgDom.textContent = weakSet.length
      ? "Practising your weakest keys: " + weakSet.join(" ")
      : "Complete a few tests to identify your weak keys.";
  }
  if (S.mode === "code") {
    msgDom.textContent = "Code snippets — symbols and punctuation count as keys.";
  }

  inner.style.transform = "translateY(0)";
  ghost.hidden = true;
  place();
  focus();
}

function start() {
  t0 = performance.now();
  liveDom.classList.add("show");
  tm = setInterval(tick, 100);
}

function tick() {
  const S = state.S;
  const el = (performance.now() - t0) / 1000;
  const sec = Math.floor(el);
  if (sec > lastSec) {
    samples.push({ c: correct, t: total, e: errs });
    lastSec = sec;
  }
  const w = el > 0 ? correct / 5 / (el / 60) : 0;
  lwDom.textContent = Math.round(w);
  laDom.textContent = total ? Math.round(100 * (total - errs) / total) : 100;
  ltDom.textContent = S.mode === "time" ? Math.max(0, Math.ceil(S.amt - el)) : Math.floor(el);

  const pb = state.P[modeKey()];
  if (S.ghost && pb && (S.mode === "time" || S.mode === "words")) {
    ghost.hidden = false;
    pos(ghost, Math.floor(pb * 5 * el / 60));
  } else {
    ghost.hidden = true;
  }

  if (S.mode === "time" && el >= S.amt) finish(S.amt);
}

function type(ch) {
  if (done) return;
  if (!t0) start();
  if (i >= text.length) return;

  const exp = text[i], ok = ch === exp;
  beep(ok);
  const l = exp.toLowerCase();
  if (/[a-z]/.test(l)) {
    state.K[l] = state.K[l] || [0, 0];
    state.K[l][0]++;
    if (!ok) state.K[l][1]++;
  }

  total++;
  // Advance after every printable key, including mistakes. A missed key is
  // marked red, but must not trap the caret and prevent the test continuing.
  if (ok) { correct++; st[i] = 1; }
  else { errs++; st[i] = 2; }
  chars[i].className = st[i] === 1 ? "c" : "x";
  if (!ok && exp === " ") chars[i].className = "x";
  i++;
  place();

  if (i >= text.length) {
    finish((performance.now() - t0) / 1000);
  }
}

function back(word) {
  if (done || i === 0) return;
  do {
    i--;
    if (st[i] === 1) correct--;
    if (st[i] === 2) errs--;
    st[i] = 0;
    chars[i].className = "";
  } while (word && i > 0 && text[i - 1] !== " ");
  place();
}

function finish(el) {
  if (done) return;
  done = true;
  clearInterval(tm);
  el = Math.max(el, 0.5);

  const wpm = correct / 5 / (el / 60);
  const raw = total / 5 / (el / 60);
  const acc = total ? 100 * (total - errs) / total : 0;

  const deltas = samples.map((s, j) => (s.c - (samples[j - 1] ? samples[j - 1].c : 0)) * 12);
  let cons = 100;
  if (deltas.length > 1) {
    const m = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const sd = Math.sqrt(deltas.reduce((a, b) => a + (b - m) ** 2, 0) / deltas.length);
    cons = m ? Math.max(0, 100 * (1 - sd / m)) : 0;
  }

  const k = modeKey(), prev = state.P[k] || 0;
  const isPB = wpm > prev && total > 10 && acc >= 80;
  if (isPB) { state.P[k] = Math.round(wpm * 10) / 10; savePBs(); }

  if (total > 10) {
    state.H.unshift({ t: Date.now(), m: modeLabel(), w: Math.round(wpm), a: Math.round(acc), r: Math.round(raw) });
    saveHistory();
    const today = new Date().toDateString();
    if (!state.D.includes(today)) {
      state.D.push(today);
      state.D = state.D.slice(-400);
      saveDays();
    }
  }

  saveKeys();
  fbAfterTest(wpm, acc, raw, total > 10, modeKey);

  clearTimeout(window._sv);
  window._sv = setTimeout(syncUser, 800);

  if (onFinishCallback) {
    onFinishCallback({ wpm, raw, acc, cons, isPB, prev, el, correct, errs, total, samples });
  }
}

// Input handlers
export function handleInput(e) {
  const value = e.target.value;
  // Mobile IMEs may dispatch a full composition; score only newly inserted
  // text once composition is committed.
  for (const ch of value) {
    if (ch === "\n" || ch === "\r") continue;
    type(ch);
  }
  e.target.value = "";
}

export function handleKeydown(e, isTypingOK) {
  if (!isTypingOK(e)) return;
  if (e.key === "Tab" || e.key === "Escape") { e.preventDefault(); restart(); return; }
  if (e.key === "Enter" && done) { e.preventDefault(); restart(); return; }
  if (done) return;
  if (e.key === "Backspace") { e.preventDefault(); back(e.ctrlKey || e.altKey); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length === 1) {
    if (document.activeElement !== hid) focus();
    // Let the focused hidden input produce one input event. Handling keydown
    // and input together caused some layouts/browsers to submit keys twice.
  }
}

export function getSamples() { return samples; }
