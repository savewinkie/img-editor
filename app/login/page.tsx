"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const BG = "#1C1917";
const BG2 = "#231F1C";
const BORDER = "rgba(250,247,242,0.08)";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) { setMessage({ text: "Vul alle velden in.", type: "error" }); return; }
    setLoading(true); setMessage(null);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ text: error.message, type: "error" });
      else window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage({ text: error.message, type: "error" });
      else setMessage({ text: "Check je email om je account te bevestigen.", type: "success" });
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px",
    background: BG2, border: `1px solid rgba(250,247,242,0.1)`,
    color: "#FAF7F2", fontSize: 14, outline: "none",
    boxSizing: "border-box", letterSpacing: 0.5,
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "sans-serif", color: "#FAF7F2", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Grain */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4 }} />

      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(250,247,242,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,247,242,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 2, padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
        <a href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-1px", color: "#FAF7F2", textDecoration: "none" }}>image-toolz</a>
        <span style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>
          {isLogin ? "Inloggen" : "Account aanmaken"}
        </span>
        <a href="/" style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.4)", textDecoration: "none", border: `1px solid rgba(250,247,242,0.15)`, padding: "8px 20px" }}>
          ← Terug
        </a>
      </header>

      {/* Content */}
      <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Titel */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(250,247,242,0.3)", margin: "0 0 16px" }}>
              {isLogin ? "Welkom terug" : "Nieuw account"}
            </p>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 400, letterSpacing: "-2px", lineHeight: 1, margin: 0, color: "#FAF7F2", fontFamily: "'Times New Roman', Georgia, serif" }}>
              {isLogin ? (
                <>Log <em style={{ fontStyle: "italic", color: "rgba(250,247,242,0.4)" }}>in</em></>
              ) : (
                <>Maak een <em style={{ fontStyle: "italic", color: "rgba(250,247,242,0.4)" }}>account</em></>
              )}
            </h1>
          </div>

          {/* Google knop */}
          <button onClick={handleGoogle}
            style={{ width: "100%", padding: "14px", marginBottom: 24, background: "transparent", border: `1px solid rgba(250,247,242,0.15)`, color: "rgba(250,247,242,0.7)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,247,242,0.4)"; e.currentTarget.style.color = "#FAF7F2"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,247,242,0.15)"; e.currentTarget.style.color = "rgba(250,247,242,0.7)"; }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Doorgaan met Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(250,247,242,0.08)" }} />
            <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.25)" }}>of</span>
            <div style={{ flex: 1, height: 1, background: "rgba(250,247,242,0.08)" }} />
          </div>

          {/* Formulier */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.com"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(250,247,242,0.4)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(250,247,242,0.1)"}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Wachtwoord</label>
                {isLogin && (
                  <button onClick={() => setMessage({ text: "Stuur een reset email via Supabase dashboard.", type: "success" })}
                    style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,247,242,0.25)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Vergeten?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(250,247,242,0.4)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(250,247,242,0.1)"}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {/* Fout/succes melding */}
            {message && (
              <div style={{ padding: "12px 16px", border: `1px solid ${message.type === "error" ? "rgba(255,80,80,0.3)" : "rgba(80,200,120,0.3)"}`, background: message.type === "error" ? "rgba(255,80,80,0.05)" : "rgba(80,200,120,0.05)", fontSize: 13, color: message.type === "error" ? "#ff8080" : "#80c880", lineHeight: 1.5 }}>
                {message.text}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", padding: "16px", marginTop: 8, background: loading ? "rgba(250,247,242,0.1)" : "#FAF7F2", color: loading ? "rgba(250,247,242,0.3)" : BG, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {loading ? "Laden..." : isLogin ? "Inloggen" : "Account aanmaken"}
            </button>
          </div>

          {/* Wissel */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(250,247,242,0.35)" }}>
              {isLogin ? "Nog geen account?" : "Al een account?"}
            </span>
            <button onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
              style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#FAF7F2", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}>
              {isLogin ? "Registreren" : "Inloggen"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 2, padding: "20px 48px", borderTop: `1px solid rgba(250,247,242,0.06)`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.2)" }}>© 2026 image-toolz</span>
        <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.2)" }}>Veilig · Gratis</span>
      </div>
    </div>
  );
}