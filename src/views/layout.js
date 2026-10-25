// ── Layout: Header + shell ──

import { fbOK, user, profile } from '../firebase.js';
import { state } from '../store.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function streak() {
  let s = 0;
  const d = new Date();
  if (!state.D.includes(d.toDateString())) d.setDate(d.getDate() - 1);
  while (state.D.includes(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

export function renderLayout() {
  return `
    <header class="header" id="main-header">
      <div class="header-inner">
        <a href="#/test" class="logo">
          <div class="logo-icon"></div>
          Type<span class="logo-accent">forge</span>
        </a>

        <nav aria-label="Main navigation" id="main-nav">
          <a href="#/test" data-n="test">Test</a>
          <a href="#/leaderboard" data-n="leaderboard">Leaderboard</a>
          <a href="#/profile" data-n="profile">Profile</a>
          <a href="#/settings" data-n="settings">Customize</a>
        </nav>

        <div class="header-right" id="header-right">
          <span id="streak-display"></span>
          <span id="user-box"></span>
        </div>
      </div>
    </header>

    <main class="layout">
      <div data-view="test" id="view-test"></div>
      <div data-view="leaderboard" id="view-leaderboard"></div>
      <div data-view="profile" id="view-profile"></div>
      <div data-view="settings" id="view-settings"></div>
      <div data-view="auth" id="view-auth"></div>
    </main>
  `;
}

export function renderUser() {
  const box = document.getElementById("user-box");
  if (!box) return;

  const n = user && ((profile && profile.name) || user.displayName || user.email || "?");
  if (user) {
    box.innerHTML = `<a class="avatar" href="#/profile" title="${esc(n)}">${esc(n[0].toUpperCase())}</a>`;
  } else {
    box.innerHTML = fbOK ? '<a class="auth-link" href="#/auth">Sign in</a>' : '';
  }
}

export function renderStreak() {
  const el = document.getElementById("streak-display");
  if (!el) return;
  const sk = streak();
  el.innerHTML = sk
    ? `<span class="streak-badge">${sk}-day streak</span>`
    : '';
}

export function updateNav(view) {
  document.querySelectorAll("nav a").forEach(a => {
    a.classList.toggle("on", a.dataset.n === view);
  });
}
