import React, { useState } from "react";
import { Lock } from "lucide-react";

const T = {
  bg: "#F5F6F4", ink: "#172233", inkSoft: "#46566A", faint: "#8593A2",
  line: "#E3E6E3", surface: "#FFFFFF", green: "#2E6F5E", clay: "#B4533C",
};

// Simple shared-password gate. NOT real security — anyone who reads the
// source (or this file) can see the password. It only stops casual visitors.
// Set via environment variable VITE_SITE_PASSWORD at build time.
const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || "";

const SESSION_KEY = "lillgarden_auth_v1";

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => {
    if (!SITE_PASSWORD) return true; // no password configured -> open
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return children;

  const submit = (e) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}
      className="flex items-center justify-center px-4">
      <form onSubmit={submit} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14 }}
        className="p-6 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={18} style={{ color: T.green }} />
          <h1 style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Brf Lillgården – Ekonomi</h1>
        </div>
        <p style={{ color: T.inkSoft, fontSize: 13, marginBottom: 14 }}>
          Den här sidan är endast för styrelsen. Ange lösenordet ni kommit överens om.
        </p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Lösenord"
          style={{ width: "100%", border: `1px solid ${error ? T.clay : T.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 14 }}
        />
        {error && <p style={{ color: T.clay, fontSize: 12, marginTop: 6 }}>Fel lösenord, försök igen.</p>}
        <button type="submit"
          style={{ marginTop: 14, background: T.green, color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 8, width: "100%" }}>
          Lås upp
        </button>
      </form>
    </div>
  );
}
