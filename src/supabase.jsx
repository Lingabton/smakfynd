// src/supabase.jsx — Supabase client + auth hook (shared with quiz.smakfynd.se)
const SUPABASE_URL = "https://bfzzsniebwxwrnkmeymg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmenpzbmllYnd4d3Jua21leW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjMzMzgsImV4cCI6MjA5Mjc5OTMzOH0.DxlxqgJ8ANtAaOS95wX1hr6Cd7oEP7l3pJQAy52L778";

const isProduction = window.location.hostname.endsWith(".smakfynd.se");

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, opts) {
  let c = name + "=" + encodeURIComponent(value) + "; path=" + (opts.path || "/");
  if (opts.domain) c += "; domain=" + opts.domain;
  if (opts.sameSite) c += "; SameSite=" + opts.sameSite;
  if (opts.secure) c += "; Secure";
  c += "; max-age=" + (60 * 60 * 24 * 365);
  document.cookie = c;
}

function removeCookie(name, opts) {
  document.cookie = name + "=; path=/; max-age=0" + (opts.domain ? "; domain=" + opts.domain : "");
}

const cookieStorage = {
  getItem: function(key) { return getCookie(key); },
  setItem: function(key, value) { setCookie(key, value, { domain: ".smakfynd.se", sameSite: "lax", secure: true, path: "/" }); },
  removeItem: function(key) { removeCookie(key, { domain: ".smakfynd.se" }); },
};

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: "smakfynd-auth",
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    ...(isProduction && { storage: cookieStorage }),
  },
});
