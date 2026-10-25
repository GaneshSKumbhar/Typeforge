// ── Persistent local storage + reactive state ──

const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove(k) { try { localStorage.removeItem(k); } catch {} }
};

// All state lives in this single object so mutations work across modules
export const state = {
  // Settings
  S: Object.assign({
    mode: "time", amt: 30,
    punct: false, nums: false, ghost: true,
    theme: "auto", live: true,
    caret: "line", fs: 24,
    accent: "", sound: false
  }, ls.get("tf_s", {})),

  K: ls.get("tf_k", {}),   // key accuracy { letter: [total, errors] }
  H: ls.get("tf_h", []),    // history array
  P: ls.get("tf_p", {}),    // personal bests
  D: ls.get("tf_d", []),    // daily activity strings
};

export function saveSettings() { ls.set("tf_s", state.S); }
export function saveKeys()     { ls.set("tf_k", state.K); }

export function saveHistory() {
  state.H = state.H.slice(0, 50);
  ls.set("tf_h", state.H);
}

export function savePBs()  { ls.set("tf_p", state.P); }
export function saveDays() { ls.set("tf_d", state.D); }

export function resetAll() {
  state.K = {};
  state.H = [];
  state.P = {};
  state.D = [];
  ["tf_k", "tf_h", "tf_p", "tf_d"].forEach(k => ls.remove(k));
}

// Bulk restore from cloud
export function restoreFromCloud(data) {
  if (data.keys)     { Object.assign(state.K, data.keys); ls.set("tf_k", state.K); }
  if (data.pbs)      { Object.assign(state.P, data.pbs);  ls.set("tf_p", state.P); }
  if (data.hist)     { state.H = data.hist; ls.set("tf_h", state.H); }
  if (data.days)     { state.D = [...new Set([...state.D, ...data.days])]; ls.set("tf_d", state.D); }
  if (data.settings) { Object.assign(state.S, data.settings); ls.set("tf_s", state.S); }
}
