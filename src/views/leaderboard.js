// ── Leaderboard View ──

import { fbOK, user, loadLeaderboard } from '../firebase.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const BOARDS = ["time15", "time30", "time60", "time120", "words10", "words25", "words50"];
let lbKey = "time30";

export function renderLeaderboard(container) {
  container.innerHTML = `
    <div class="view-content">
      <h2 class="section-title">Leaderboard</h2>
      <p class="text-muted mb-lg">Every player’s best qualifying score, ranked by speed. Choose a test to compare results.</p>

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
        <p>The leaderboard requires Firebase. Add your web app configuration to <code>index.html</code> as described in the README.</p>
      </div>`;
    return;
  }

  const selectedBoard = lbKey;
  box.innerHTML = `<div class="card lb-empty"><div class="lb-empty-icon" aria-hidden="true">✦</div><p>Loading ${esc(selectedBoard.replace(/(\D+)(\d+)/, "$1 $2"))} scores…</p></div>`;

  try {
    const scores = await loadLeaderboard(selectedBoard);
    if (selectedBoard !== lbKey || box !== document.getElementById("lb-content")) return;

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

    box.innerHTML = `
      <section class="leaderboard-panel" aria-label="${esc(selectedBoard.replace(/(\D+)(\d+)/, "$1 $2"))} rankings">
        <div class="leaderboard-head">
          <div><span class="leaderboard-kicker">Community rankings</span><h3>${esc(selectedBoard.replace(/(\D+)(\d+)/, "$1 $2"))}</h3></div>
          <span class="leaderboard-count">${scores.length} ${scores.length === 1 ? "player" : "players"}</span>
        </div>
        <div class="lb-table-wrap">
        <table class="lb-table">
          <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">WPM</th><th scope="col">Accuracy</th><th scope="col">Updated</th></tr></thead>
          <tbody>${scores.map((v, index) => {
            const rank = index + 1;
            const isMe = user && v.id === user.uid;
            return `
              <tr class="${isMe ? "me" : ""}">
                <td>${rank === 1 ? "♛ 01" : String(rank).padStart(2, "0")}</td>
                <td class="player">${esc(v.name || "Player")}${isMe ? " <small>(you)</small>" : ""}</td>
                <td class="score">${Number(v.wpm).toFixed(1)}</td>
                <td>${Number(v.acc)}%</td>
                <td>${Number.isFinite(Number(v.t)) ? new Date(Number(v.t)).toLocaleDateString() : "—"}</td>
              </tr>`;
          }).join("")}</tbody>
        </table>
        </div>
      </section>`;
  } catch (e) {
    if (selectedBoard !== lbKey || box !== document.getElementById("lb-content")) return;
    box.innerHTML = `
      <div class="card">
        <p>Could not load scores. Check your Firestore rules and connection.</p>
      </div>`;
  }
}
