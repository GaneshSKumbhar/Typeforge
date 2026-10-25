// ── Leaderboard View ──

import { fbOK, user, loadLeaderboard } from '../firebase.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const BOARDS = ["time15", "time30", "time60", "time120", "words10", "words25", "words50"];
let lbKey = "time30";

export function renderLeaderboard(container) {
  container.innerHTML = `
    <div class="view-content">
      <h2 class="section-title">Leaderboard</h2>
      <p class="text-muted mb-lg">Top scores across all players. Only standard tests without punctuation/numbers qualify.</p>

      <div class="lb-tabs" id="lb-tabs">
        ${BOARDS.map(k =>
          `<button data-b="${k}" class="${k === lbKey ? "on" : ""}">${k.replace(/(\D+)(\d+)/, "$1 $2")}</button>`
        ).join("")}
      </div>

      <div id="lb-content"></div>
    </div>
  `;

  document.getElementById("lb-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-b]");
    if (!b) return;
    lbKey = b.dataset.b;
    renderLeaderboard(container);
  });

  loadBoard();
}

async function loadBoard() {
  const box = document.getElementById("lb-content");
  if (!box) return;

  if (!fbOK) {
    box.innerHTML = `
      <div class="card">
        <p>The leaderboard requires Firebase. Add your config in <code>firebase-config.js</code> (see README).</p>
      </div>`;
    return;
  }

  box.innerHTML = `
    <div style="text-align:center;padding:40px;color:var(--fg-dim);">
      <div style="font-size:24px;margin-bottom:8px;animation:pulse 1.2s infinite;">⚡</div>
      Loading scores...
    </div>`;

  try {
    const scores = await loadLeaderboard(lbKey);

    if (!scores || scores.length === 0) {
      box.innerHTML = `
        <div class="card lb-empty">
          <div class="lb-empty-icon" aria-hidden="true">✦</div>
          <h3>No published scores yet</h3>
          <p>This ${esc(lbKey.replace(/(\D+)(\d+)/, "$1 $2"))} board is connected, but Firestore has no scores for it yet.</p>
          <p>${user
            ? 'Complete a standard test with punctuation and numbers off, at least 85% accuracy, and 11 or more keystrokes. Your best qualifying score will be published automatically.'
            : 'Your practice scores stay on this device while signed out. Sign in, then complete a standard test with punctuation and numbers off, at least 85% accuracy, and 11 or more keystrokes to publish your best score.'}</p>
          ${user ? '' : '<a class="btn-primary" href="#/auth">Sign in to publish scores</a>'}
        </div>`;
      return;
    }

    let rank = 0;
    box.innerHTML = `
      <div class="history-wrap">
        <table class="history-table">
          <tr>
            <th>#</th>
            <th>player</th>
            <th>wpm</th>
            <th>acc</th>
            <th>date</th>
          </tr>
          ${scores.map(v => {
            rank++;
            const isMe = user && v.id === user.uid;
            const medal = rank === 1 ? "🥇 " : rank === 2 ? "🥈 " : rank === 3 ? "🥉 " : "";
            return `
              <tr class="${isMe ? "me" : ""}">
                <td>${medal}${rank}</td>
                <td>${esc(v.name)}</td>
                <td>${v.wpm}</td>
                <td>${v.acc}%</td>
                <td>${new Date(v.t).toLocaleDateString()}</td>
              </tr>`;
          }).join("")}
        </table>
      </div>`;
  } catch (e) {
    box.innerHTML = `
      <div class="card">
        <p>Could not load scores. Check your Firestore rules and connection.</p>
      </div>`;
  }
}
