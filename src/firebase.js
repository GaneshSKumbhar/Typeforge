// ── Firebase integration ──

import { state, saveSettings, restoreFromCloud } from './store.js';

let auth = null;
let db = null;
export let fbOK = false;
export let user = null;
export let profile = null;

// Friendly error messages
const FRIENDLY = {
  "auth/invalid-credential":    "Email or password is incorrect.",
  "auth/wrong-password":        "Email or password is incorrect.",
  "auth/user-not-found":        "Email or password is incorrect.",
  "auth/email-already-in-use":  "That email already has an account. Try logging in.",
  "auth/weak-password":         "Use at least 6 characters for the password.",
  "auth/invalid-email":         "Enter a valid email address.",
  "auth/too-many-requests":     "Too many attempts. Wait a minute and try again.",
  "auth/popup-closed-by-user":  "Google sign-in was closed before finishing."
};

export const friendly = (x) => FRIENDLY[x.code] || x.message;

// Initialize Firebase
export function initFirebase() {
  const cfg = window.FIREBASE_CONFIG || {};
  if (window.firebase && cfg.apiKey && !/^YOUR/.test(cfg.apiKey)) {
    try {
      firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      fbOK = true;
    } catch (e) { console.error(e); }
  }
  return { auth, db, fbOK };
}

export function getAuth() { return auth; }
export function getDB() { return db; }

// Auth state listener
export function onAuthChange(callback) {
  if (!fbOK || !auth) return;
  auth.onAuthStateChanged(callback);
}

// Sign in
export async function signIn(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

// Register
export async function register(email, password, name) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name });
  await db.collection("users").doc(cred.user.uid).set({
    name, bio: "", created: Date.now()
  }, { merge: true });
  return cred;
}

// Google sign in
export async function signInWithGoogle() {
  return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}

// Sign out
export async function signOut() {
  return auth.signOut();
}

// Send password reset
export async function resetPassword(email) {
  return auth.sendPasswordResetEmail(email);
}

// Handle authenticated user – loads profile, merges cloud data
export async function handleUser(u) {
  user = u;
  if (!u) { profile = null; return null; }

  try {
    const ref = db.collection("users").doc(u.uid);
    const snap = await ref.get();
    let d = snap.exists ? snap.data() : null;

    if (!d || !d.name) {
      d = Object.assign({}, d, {
        name: (u.displayName || (u.email || "player").split("@")[0]).slice(0, 20),
        bio: "", created: Date.now()
      });
      await ref.set(d, { merge: true });
    }

    profile = d;
    restoreFromCloud(d);
  } catch (e) { console.error(e); }

  return profile;
}

// Sync user data to cloud
export function syncUser() {
  if (!user || !db) return;
  db.collection("users").doc(user.uid).set({
    keys: state.K, pbs: state.P,
    hist: state.H.slice(0, 50),
    days: state.D.slice(-120),
    settings: state.S,
    updated: Date.now()
  }, { merge: true }).catch(console.error);
}

// Save profile name/bio
export async function saveProfile(name, bio) {
  if (!user || !db) return;
  await db.collection("users").doc(user.uid).set({ name, bio }, { merge: true });
  await user.updateProfile({ displayName: name });
  profile = Object.assign(profile || {}, { name, bio });
}

// After a test – submit score
export async function afterTest(wpm, acc, raw, counted, keyFn) {
  if (!user || !db || !counted) return;
  const S = state.S;
  try {
    syncUser();
    db.collection("users").doc(user.uid).set({
      tests: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    const k = keyFn();
    if ((S.mode === "time" || S.mode === "words") && !S.punct && !S.nums && acc >= 85 && wpm <= 300) {
      const ref = db.collection("boards").doc(k).collection("scores").doc(user.uid);
      const s = await ref.get();
      if (!s.exists || s.data().wpm < wpm) {
        await ref.set({
          name: (profile && profile.name) || "Player",
          wpm: Math.round(wpm * 10) / 10,
          acc: Math.round(acc),
          t: Date.now()
        });
      }
    }
  } catch (e) { console.error(e); }
}

// Load leaderboard
export async function loadLeaderboard(boardKey) {
  if (!fbOK || !db) return null;
  const snap = await db.collection("boards").doc(boardKey).collection("scores")
    .orderBy("wpm", "desc").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
