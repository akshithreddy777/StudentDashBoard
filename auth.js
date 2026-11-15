// =====================================================
// StudyDeck – auth.js   (shared by login.html and index.html)
//
//  • index.html : loaded in <head>. No session -> redirects to login.html.
//                 Otherwise sets window.SD_USER and wires the Log out button.
//  • login.html : loaded at the end of <body>. Runs the sign-in / sign-up form,
//                 then redirects to index.html.
//
// window.SD_USER -> { id, name, email } or null
// window.SD_AUTH -> { logout() }
//
// IMPORTANT: accounts live in this browser's localStorage. That keeps
// different people on one device from seeing each other's data, but it is
// NOT server-side security. For real accounts use a backend.
// =====================================================
(function () {
  "use strict";

  const LOGIN_PAGE = "login.html";
  const APP_PAGE = "index.html";

  const USERS_KEY = "sd_users";
  const SESSION_KEY = "sd_session";
  const THEME_KEY = "sd_theme";
  // Data keys that existed before accounts were added (see migrateLegacyData).
  const LEGACY_SUFFIXES = [
    "tasks", "notes", "expenses", "goals", "events",
    "study", "notifications", "reminded", "activity",
  ];
  const PBKDF2_ITERATIONS = 150000;
  const MIN_PASSWORD_LENGTH = 8;

  const $ = (id) => document.getElementById(id);

  // ---------- Storage helpers ----------
  function readJSON(storage, key, fallback) {
    try {
      const raw = storage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function getUsers() {
    return readJSON(localStorage, USERS_KEY, []);
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ---------- Password hashing (PBKDF2 via Web Crypto) ----------
  // We never store the password itself: only a random salt and the derived hash.
  const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

  async function hashPassword(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      keyMaterial, 256
    );
    return toBase64(bits);
  }

  // Compare without bailing out at the first mismatch.
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Session ----------
  // "Keep me signed in" -> localStorage (survives closing the browser).
  // Otherwise -> sessionStorage (ends when the tab closes).
  function readSession() {
    return readJSON(sessionStorage, SESSION_KEY, null) || readJSON(localStorage, SESSION_KEY, null);
  }

  function startSession(userId, remember) {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify({ userId }));
  }

  function endSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function getCurrentUser() {
    const session = readSession();
    if (!session) return null;
    const user = getUsers().find((u) => u.id === session.userId);
    if (!user) {
      endSession();
      return null;
    }
    return { id: user.id, name: user.name, email: user.email };
  }

  // ---------- Account actions ----------
  // Data saved before accounts existed ("sd_tasks", ...) is moved into the
  // very first account so nothing is lost.
  function migrateLegacyData(userId) {
    let moved = false;
    LEGACY_SUFFIXES.forEach((suffix) => {
      const raw = localStorage.getItem(`sd_${suffix}`);
      if (raw === null) return;
      localStorage.setItem(`sd_u_${userId}_${suffix}`, raw);
      localStorage.removeItem(`sd_${suffix}`);
      moved = true;
    });
    if (moved) sessionStorage.setItem("sd_notice", "Your existing data was moved into this account.");
  }

  async function signUp({ name, email, password }) {
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error("An account with this email already exists. Sign in instead.");
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const user = {
      id: newId(),
      name,
      email,
      salt: toBase64(salt),
      hash: await hashPassword(password, salt),
      createdAt: Date.now(),
    };
    const isFirstAccount = users.length === 0;
    users.push(user);
    saveUsers(users);
    if (isFirstAccount) migrateLegacyData(user.id);
    return user;
  }

  async function signIn({ email, password }) {
    const user = getUsers().find((u) => u.email === email);
    // One generic message, so the form doesn't reveal which emails are registered.
    const failure = new Error("Email or password is incorrect.");
    if (!user) throw failure;
    const hash = await hashPassword(password, fromBase64(user.salt));
    if (!safeEqual(hash, user.hash)) throw failure;
    return user;
  }

  // ---------- Shared setup ----------
  // Apply the saved theme so login.html matches the app.
  const savedTheme = readJSON(localStorage, THEME_KEY, null);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", (savedTheme || (prefersDark ? "dark" : "light")) === "dark");

  const isLoginPage = document.documentElement.dataset.page === "login";
  const currentUser = getCurrentUser();

  window.SD_USER = currentUser;
  window.SD_AUTH = {
    logout() {
      endSession();
      location.replace(LOGIN_PAGE);
    },
  };

  // Signed in or out in another tab -> re-run this page's check.
  window.addEventListener("storage", (event) => {
    if (event.key === SESSION_KEY) location.reload();
  });

  // =====================================================
  // PAGE: index.html  (the app)
  // =====================================================
  if (!isLoginPage) {
    if (!currentUser) {
      location.replace(LOGIN_PAGE);
      return;
    }
    document.addEventListener("DOMContentLoaded", () => {
      const nameEl = $("userName");
      const logoutBtn = $("logoutBtn");
      if (nameEl) nameEl.textContent = currentUser.name;
      if (logoutBtn) logoutBtn.addEventListener("click", () => window.SD_AUTH.logout());
    });
    return;
  }

  // =====================================================
  // PAGE: login.html
  // =====================================================
  if (currentUser) {
    location.replace(APP_PAGE); // already signed in
    return;
  }

  const ui = {
    tabIn: $("authTabSignin"),
    tabUp: $("authTabSignup"),
    title: $("authTitle"),
    subtitle: $("authSubtitle"),
    form: $("authForm"),
    nameWrap: $("authNameWrap"),
    name: $("authName"),
    email: $("authEmail"),
    password: $("authPassword"),
    showPassword: $("authShowPassword"),
    confirmWrap: $("authConfirmWrap"),
    confirm: $("authConfirm"),
    remember: $("authRemember"),
    error: $("authError"),
    submit: $("authSubmit"),
  };

  let mode = "signin";

  function showError(message) {
    ui.error.textContent = message;
    ui.error.classList.toggle("hidden", !message);
  }

  function setMode(nextMode) {
    mode = nextMode;
    const signingUp = mode === "signup";

    ui.tabIn.classList.toggle("active", !signingUp);
    ui.tabUp.classList.toggle("active", signingUp);
    ui.tabIn.setAttribute("aria-selected", String(!signingUp));
    ui.tabUp.setAttribute("aria-selected", String(signingUp));

    ui.nameWrap.classList.toggle("hidden", !signingUp);
    ui.confirmWrap.classList.toggle("hidden", !signingUp);
    ui.title.textContent = signingUp ? "Create your account" : "Welcome back";
    ui.subtitle.textContent = signingUp
      ? "Your tasks, notes and goals stay private to your account."
      : "Sign in to pick up where you left off.";
    ui.submit.textContent = signingUp ? "Create account" : "Sign in";
    ui.password.autocomplete = signingUp ? "new-password" : "current-password";

    ui.password.value = "";
    ui.confirm.value = "";
    showError("");
    (signingUp ? ui.name : ui.email).focus();
  }

  function validate(values) {
    if (mode === "signup" && values.name.length < 2) return "Enter your name (at least 2 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return "Enter a valid email address.";
    if (mode === "signup" && values.password.length < MIN_PASSWORD_LENGTH) {
      return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (!values.password) return "Enter your password.";
    if (mode === "signup" && values.password !== values.confirm) return "The two passwords don't match.";
    return "";
  }

  ui.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");

    const values = {
      name: ui.name.value.trim(),
      email: ui.email.value.trim().toLowerCase(),
      password: ui.password.value,
      confirm: ui.confirm.value,
    };

    const problem = validate(values);
    if (problem) return showError(problem);

    if (!window.crypto || !window.crypto.subtle) {
      return showError("Accounts need a secure page. Open the app from https:// or http://localhost.");
    }

    const idleLabel = ui.submit.textContent;
    ui.submit.disabled = true;
    ui.submit.textContent = mode === "signup" ? "Creating account…" : "Signing in…";

    try {
      const user = mode === "signup" ? await signUp(values) : await signIn(values);
      startSession(user.id, ui.remember.checked);
      location.replace(APP_PAGE);
    } catch (error) {
      showError(error.message || "Something went wrong. Try again.");
      ui.submit.disabled = false;
      ui.submit.textContent = idleLabel;
    }
  });

  ui.tabIn.addEventListener("click", () => setMode("signin"));
  ui.tabUp.addEventListener("click", () => setMode("signup"));

  ui.showPassword.addEventListener("click", () => {
    const hidden = ui.password.type === "password";
    ui.password.type = hidden ? "text" : "password";
    ui.confirm.type = hidden ? "text" : "password";
    ui.showPassword.textContent = hidden ? "Hide" : "Show";
    ui.showPassword.setAttribute("aria-pressed", String(hidden));
  });

  // First visit ever? Open on "Create account"; otherwise "Sign in".
  setMode(getUsers().length === 0 ? "signup" : "signin");
})();
