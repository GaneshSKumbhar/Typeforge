// ── Typeforge – Main Entry ──

import { state } from './store.js';
import { initFirebase, onAuthChange, handleUser } from './firebase.js';
import { renderLayout, renderUser, renderStreak, updateNav } from './views/layout.js';
import { renderTest, reenterTest, applyLook } from './views/test.js';
import { renderAuth } from './views/auth.js';
import { renderProfile } from './views/profile.js';
import { renderSettings, applyTheme } from './views/settings.js';
import { renderLeaderboard } from './views/leaderboard.js';
import { place, focus, isDone } from './engine.js';

// ── Init ──
const app = document.getElementById("app");
let currentView = "test";
let testInitialized = false;

// Render shell
app.innerHTML = renderLayout();

// Apply theme from settings
applyTheme();

// Init Firebase
initFirebase();

// ── Routing ──
function route() {
  const h = (location.hash || "#/test").slice(2);
  currentView = ["test", "leaderboard", "profile", "settings", "auth"].includes(h) ? h : "test";

  // Show/hide views
  document.querySelectorAll("[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === currentView);
  });

  updateNav(currentView);

  // Init test view once
  if (currentView === "test") {
    if (!testInitialized) {
      renderTest(document.getElementById("view-test"));
      testInitialized = true;
    } else {
      reenterTest();
    }
  }

  if (currentView === "leaderboard") {
    renderLeaderboard(document.getElementById("view-leaderboard"));
  }

  if (currentView === "profile") {
    renderProfile(document.getElementById("view-profile"), {
      onUpdate: () => { renderStreak(); renderUser(); }
    });
  }

  if (currentView === "settings") {
    renderSettings(document.getElementById("view-settings"));
  }

  if (currentView === "auth") {
    renderAuth(document.getElementById("view-auth"), () => {
      location.hash = "#/profile";
    });
  }

  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);

// ── Auth state ──
onAuthChange(async (u) => {
  await handleUser(u);
  applyTheme();
  applyLook();
  renderUser();
  renderStreak();

  if (testInitialized) {
    renderTest(document.getElementById("view-test"));
  }

  if (u && currentView === "auth") {
    location.hash = "#/profile";
  }

  if (currentView === "profile") {
    renderProfile(document.getElementById("view-profile"), {
      onUpdate: () => { renderStreak(); renderUser(); }
    });
  }
  if (currentView === "auth") {
    renderAuth(document.getElementById("view-auth"), () => {
      location.hash = "#/profile";
    });
  }
});

// ── Kick off ──
renderUser();
renderStreak();
route();

// Small crystal sparks follow a physical mouse, but do not run on touch or
// when the visitor has asked the OS to reduce motion.
if (matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
  let lastSpark = 0;
  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || performance.now() - lastSpark < 70) return;
    lastSpark = performance.now();
    const spark = document.createElement("span");
    spark.className = "pointer-spark";
    spark.style.left = `${e.clientX}px`;
    spark.style.top = `${e.clientY}px`;
    spark.style.setProperty("--spark-hue", Math.random() < .48 ? "42" : "190");
    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
  }, { passive: true });
}
