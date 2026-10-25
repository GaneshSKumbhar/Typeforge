// ── Auth View: Login / Register ──

import { fbOK, user, signIn, register, signInWithGoogle, signOut, resetPassword, friendly, handleUser, getAuth } from '../firebase.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const GOOGLE_ICON = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

let authTab = "login";

export function renderAuth(container, onAuthResolved) {
  if (!fbOK) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-container">
          <div class="auth-header">
            <h1>Firebase Not Configured</h1>
            <p>Open <code>firebase-config.js</code> and paste your web app config, then reload.</p>
          </div>
          <div class="card" style="text-align:center;">
            <p>Until then, results are saved only in this browser's local storage.</p>
          </div>
        </div>
      </div>`;
    return;
  }

  if (user) {
    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-container">
          <div class="auth-header">
            <h1>Welcome back!</h1>
            <p>You're signed in as <strong>${esc(user.email || "")}</strong></p>
          </div>
          <div class="card" style="text-align:center;">
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <button class="btn-primary" id="auth-go-profile">Open Profile</button>
              <button class="btn-secondary" id="auth-signout">Sign out</button>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById("auth-go-profile").onclick = () => location.hash = "#/profile";
    document.getElementById("auth-signout").onclick = () => signOut();
    return;
  }

  const isReg = authTab === "register";

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>${isReg ? "Create Account" : "Welcome Back"}</h1>
          <p>${isReg ? "Join Typeforge and compete on the leaderboard" : "Sign in to sync your progress across devices"}</p>
        </div>

        <div class="auth-card">
          <div class="auth-tabs">
            <button data-t="login" class="${isReg ? "" : "on"}">Sign in</button>
            <button data-t="register" class="${isReg ? "on" : ""}">Create account</button>
          </div>

          <form id="auth-form" autocomplete="on">
            ${isReg ? `
              <label>
                <span class="label-text">Username</span>
                <input id="auth-name" type="text" maxlength="20" required autocomplete="nickname" placeholder="Your display name">
              </label>
            ` : ""}

            <label>
              <span class="label-text">Email</span>
              <input id="auth-email" type="email" required autocomplete="email" placeholder="you@example.com">
            </label>

            <label>
              <span class="label-text">Password</span>
              <input id="auth-pass" type="password" minlength="6" required autocomplete="${isReg ? "new-password" : "current-password"}" placeholder="${isReg ? "At least 6 characters" : "Your password"}">
            </label>

            <div class="form-error" id="auth-error" role="alert"></div>

            <button class="btn-primary" type="submit" style="width:100%;">
              ${isReg ? "Create Account" : "Sign In"}
            </button>

            ${!isReg ? '<button type="button" class="forgot-link" id="auth-forgot">Forgot password?</button>' : ''}
          </form>

          <div class="form-divider">or</div>

          <button class="google-btn" id="auth-google">
            ${GOOGLE_ICON}
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  container.querySelectorAll("[data-t]").forEach(b => {
    b.onclick = () => { authTab = b.dataset.t; renderAuth(container, onAuthResolved); };
  });

  const err = m => { document.getElementById("auth-error").textContent = m; };

  // Form submit
  document.getElementById("auth-form").onsubmit = async (e) => {
    e.preventDefault();
    err("");
    const em = document.getElementById("auth-email").value.trim();
    const pw = document.getElementById("auth-pass").value;

    try {
      if (isReg) {
        const nm = document.getElementById("auth-name").value.trim().slice(0, 20);
        await register(em, pw, nm);
        const auth = getAuth();
        await handleUser(auth.currentUser);
      } else {
        await signIn(em, pw);
      }
      if (onAuthResolved) onAuthResolved();
    } catch (x) { err(friendly(x)); }
  };

  // Google
  document.getElementById("auth-google").onclick = async () => {
    try {
      await signInWithGoogle();
      if (onAuthResolved) onAuthResolved();
    } catch (x) { err(friendly(x)); }
  };

  // Forgot password
  const fp = document.getElementById("auth-forgot");
  if (fp) {
    fp.onclick = () => {
      const em = document.getElementById("auth-email").value.trim();
      if (!em) return err("Enter your email above first.");
      resetPassword(em)
        .then(() => err("Reset link sent. Check your inbox."))
        .catch(x => err(friendly(x)));
    };
  }
}
