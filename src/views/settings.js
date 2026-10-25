// ── Settings View ──

import { state, saveSettings } from '../store.js';
import { syncUser } from '../firebase.js';
import { THEMES } from '../data/words.js';
import { applyLook } from './test.js';

export function renderSettings(container) {
  const S = state.S;
  const btn = (k, v, l) =>
    `<button data-s="${k}" data-v="${v}" class="${String(S[k]) === String(v) ? "on" : ""}">${l}</button>`;

  container.innerHTML = `
    <div class="view-content">
      <h2 class="section-title">Customize</h2>
      <p class="text-muted mb-lg">Personalize your typing experience. Changes are saved instantly.</p>

      <div class="card settings-card" id="settings-card">
        <div class="setting-row">
          <span class="setting-label">Theme</span>
          <div class="group">
            ${THEMES.map(t => btn("theme", t, t)).join("")}
          </div>
        </div>

        <div class="setting-row">
          <span class="setting-label">Font Size <b id="fs-val">${S.fs}px</b></span>
          <input type="range" id="set-fs" min="16" max="40" value="${S.fs}" aria-label="Font size">
        </div>

        <div class="setting-row">
          <span class="setting-label">Accent Colour</span>
          <div class="group">
            <input type="color" id="set-accent" value="${S.accent || "#f59e0b"}" aria-label="Accent colour">
            <button id="set-accent-reset">use theme colour</button>
          </div>
        </div>

        <div class="setting-row">
          <span class="setting-label">Caret Style</span>
          <div class="group">
            ${btn("caret", "line", "line")}
            ${btn("caret", "blk", "block")}
            ${btn("caret", "ul", "underline")}
          </div>
        </div>

        <div class="setting-row">
          <span class="setting-label">Live Stats While Typing</span>
          <div class="group">
            ${btn("live", true, "show")}
            ${btn("live", false, "hide")}
          </div>
        </div>

        <div class="setting-row">
          <span class="setting-label">Keypress Sound</span>
          <div class="group">
            ${btn("sound", true, "on")}
            ${btn("sound", false, "off")}
          </div>
        </div>

        <div class="setting-row">
          <span class="setting-label">Ghost Caret</span>
          <div class="group">
            ${btn("ghost", true, "on")}
            ${btn("ghost", false, "off")}
          </div>
        </div>
      </div>
    </div>
  `;

  // Font size slider
  document.getElementById("set-fs").oninput = (e) => {
    state.S.fs = +e.target.value;
    document.getElementById("fs-val").textContent = state.S.fs + "px";
    save();
  };

  // Accent colour
  document.getElementById("set-accent").oninput = (e) => {
    state.S.accent = e.target.value;
    save();
  };

  document.getElementById("set-accent-reset").onclick = () => {
    state.S.accent = "";
    save();
    renderSettings(container);
  };

  // Setting buttons
  document.getElementById("settings-card").addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]");
    if (!b) return;
    const v = b.dataset.v;
    state.S[b.dataset.s] = v === "true" ? true : v === "false" ? false : v;
    save();
    if (b.dataset.s === "theme") applyTheme();
    renderSettings(container);
  });
}

function save() {
  saveSettings();
  applyLook();
  clearTimeout(window._sv);
  window._sv = setTimeout(syncUser, 800);
}

export function applyTheme() {
  document.documentElement.removeAttribute("data-theme");
  if (state.S.theme !== "auto") document.documentElement.setAttribute("data-theme", state.S.theme);
}
