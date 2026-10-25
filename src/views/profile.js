// ── Profile View ──

import { state, resetAll } from '../store.js';
import { user, profile, fbOK, saveProfile } from '../firebase.js';
import { streak } from './layout.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function renderProfile(container, callbacks = {}) {
  const H = state.H;
  const K = state.K;
  const n = H.length;
  const avg = n ? Math.round(H.reduce((a, b) => a + b.w, 0) / n) : 0;
  const best = n ? Math.max(...H.map(h => h.w)) : 0;
  const sk = streak();

  container.innerHTML = `
    <div class="view-content">
      <div id="profile-head"></div>

      <h2 class="section-title">Your Stats</h2>
      <div class="stats-grid" id="profile-stats">
        <div class="stat-card">
          <span>tests completed</span>
          <b>${n}</b>
        </div>
        <div class="stat-card">
          <span>average wpm</span>
          <b>${avg}</b>
        </div>
        <div class="stat-card">
          <span>best wpm</span>
          <b>${best}</b>
        </div>
        <div class="stat-card">
          <span>day streak</span>
          <b>${sk}</b>
        </div>
      </div>

      <h2 class="section-title mt-xl">Key Accuracy</h2>
      <div class="keyboard" id="keyboard-heatmap"></div>
      <div class="keyboard-legend">
        Greener keys are reliable. Redder keys need work. Grey keys need more data.
      </div>

      <h2 class="section-title">Recent Tests</h2>
      <div class="history-wrap">
        <table class="history-table" id="history-table"></table>
      </div>

      <div class="profile-footer">
        <span>All data stays in this browser unless you're signed in.</span>
        <button class="btn-secondary" id="btn-reset-data" style="padding:8px 16px;font-size:13px;">Reset all data</button>
      </div>
    </div>
  `;

  renderProfileHead();
  renderKeyboard(K);
  renderHistory(H);

  document.getElementById("btn-reset-data").onclick = () => {
    if (confirm("Delete all your results and key statistics?")) {
      resetAll();
      renderProfile(container, callbacks);
      if (callbacks.onUpdate) callbacks.onUpdate();
    }
  };
}

function renderProfileHead() {
  const el = document.getElementById("profile-head");
  if (!el) return;

  if (!user) {
    el.innerHTML = `
      <div class="card profile-card mb-lg">
        <h2 class="section-title" style="margin-top:0">Guest Profile</h2>
        <p>Results are saved in this browser only.
          ${fbOK
            ? ' <a href="#/auth">Sign in</a> to sync across devices and join the leaderboard.'
            : ' Add your Firebase config to enable accounts.'}
        </p>
      </div>`;
    return;
  }

  const name = (profile && profile.name) || user.displayName || "Player";
  el.innerHTML = `
    <div class="profile-header">
      <div class="avatar lg">${esc(name[0].toUpperCase())}</div>
      <div class="profile-info">
        <div class="profile-name">${esc(name)}</div>
        <div class="profile-meta">${esc(user.email || "")} · Joined ${new Date((profile && profile.created) || Date.now()).toLocaleDateString()}</div>
      </div>
    </div>

    <div class="card profile-card mb-lg">
      <label>
        <span class="label-text">Username</span>
        <input id="profile-name" type="text" maxlength="20" value="${esc(name)}">
      </label>
      <label>
        <span class="label-text">Bio</span>
        <input id="profile-bio" type="text" maxlength="80" value="${esc((profile && profile.bio) || "")}">
      </label>
      <div class="card-actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
        <button class="btn-primary" id="btn-save-profile">Save profile</button>
        <button class="btn-secondary" id="btn-signout">Sign out</button>
      </div>
      <div class="dim mt-md" id="profile-msg" style="font-size:13px;"></div>
    </div>`;

  document.getElementById("btn-save-profile").onclick = async () => {
    const nameVal = document.getElementById("profile-name").value.trim().slice(0, 20) || name;
    const bio = document.getElementById("profile-bio").value.trim();
    try {
      await saveProfile(nameVal, bio);
      document.getElementById("profile-msg").textContent = "Profile saved ✓";
    } catch {
      document.getElementById("profile-msg").textContent = "Could not save. Try again.";
    }
  };

  document.getElementById("btn-signout").onclick = async () => {
    const { signOut } = await import('../firebase.js');
    await signOut();
    location.hash = "#/test";
  };
}

function renderKeyboard(K) {
  const kb = document.getElementById("keyboard-heatmap");
  if (!kb) return;

  kb.innerHTML = ["qwertyuiop", "asdfghjkl", "zxcvbnm"].map(r =>
    `<div class="row">${[...r].map(l => {
      const v = K[l];
      let sty = "", tt = `${l}: not enough data`;
      if (v && v[0] >= 5) {
        const a = 1 - v[1] / v[0];
        const h = Math.max(0, Math.min(120, (a - 0.8) / 0.2 * 120));
        sty = `background:hsl(${h} 65% 45% / .3);border-color:hsl(${h} 65% 45%);box-shadow:0 0 8px hsl(${h} 65% 45% / .15)`;
        tt = `${l}: ${Math.round(a * 100)}% accurate over ${v[0]} presses`;
      }
      return `<div class="key" style="${sty}" title="${tt}">${l}</div>`;
    }).join("")}</div>`
  ).join("");
}

function renderHistory(H) {
  const table = document.getElementById("history-table");
  if (!table) return;

  if (!H.length) {
    table.innerHTML = '<tr><td style="color:var(--fg-dim);padding:20px;">No tests yet. Take a test to see your history here.</td></tr>';
    return;
  }

  table.innerHTML = `
    <tr>
      <th>when</th>
      <th>test</th>
      <th>wpm</th>
      <th>raw</th>
      <th>acc</th>
    </tr>
    ${H.slice(0, 15).map(h => `
      <tr>
        <td>${new Date(h.t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
        <td>${h.m}</td>
        <td>${h.w}</td>
        <td>${h.r}</td>
        <td>${h.a}%</td>
      </tr>
    `).join("")}
  `;
}
