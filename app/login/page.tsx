"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    if (isRegister) {
      // Account aanmaken
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        setError(error.message);
      } else {
        setError("✅ Check je email om je account te bevestigen!");
      }
    } else {
      // Inloggen
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("Onjuist email of wachtwoord");
      } else {
        window.location.href = "/";
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:3000" },
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF7F2" }}>
      <header className="px-8 py-5 flex items-center" style={{ borderBottom: "1px solid #E8DFD0" }}>
        <a href="/" className="text-2xl font-bold tracking-tighter" style={{ color: "#2A2016" }}>
          BRONS-CO
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-8 rounded-2xl" style={{ border: "1px solid #E8DFD0", background: "#FDF9F4" }}>

          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#2A2016" }}>
            {isRegister ? "Account aanmaken" : "Inloggen"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "#B8A690" }}>
            {isRegister ? "Maak een gratis account aan" : "Welkom terug bij BRONS-CO"}
          </p>

          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 mb-6"
            style={{ border: "1px solid #E8DFD0", background: "#FAF7F2", color: "#2A2016" }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Doorgaan met Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "#E8DFD0" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>of</span>
            <div className="flex-1 h-px" style={{ background: "#E8DFD0" }} />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{
              background: error.startsWith("✅") ? "#D1FAE5" : "#FEE2E2",
              color: error.startsWith("✅") ? "#065F46" : "#991B1B"
            }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Naam</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jouw naam"
                  className="px-4 py-3 text-sm outline-none rounded-xl"
                  style={{ border: "1px solid #E8DFD0", background: "#FAF7F2", color: "#2A2016" }} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.com"
                className="px-4 py-3 text-sm outline-none rounded-xl"
                style={{ border: "1px solid #E8DFD0", background: "#FAF7F2", color: "#2A2016" }} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Wachtwoord</label>
                {!isRegister && (
                  <a href="#" className="text-xs hover:opacity-60 transition-opacity" style={{ color: "#8B6F47" }}>
                    Vergeten?
                  </a>
                )}
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-3 text-sm outline-none rounded-xl"
                style={{ border: "1px solid #E8DFD0", background: "#FAF7F2", color: "#2A2016" }} />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full text-white text-sm font-medium py-3 tracking-widest uppercase transition-all rounded-full hover:opacity-90 mt-2 disabled:opacity-50"
              style={{ background: "#8B6F47" }}>
              {loading ? "Laden..." : isRegister ? "Account aanmaken" : "Inloggen"}
            </button>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "#B8A690" }}>
            {isRegister ? "Al een account?" : "Nog geen account?"}{" "}
            <button onClick={() => setIsRegister(!isRegister)} className="font-medium hover:opacity-60 transition-opacity" style={{ color: "#8B6F47" }}>
              {isRegister ? "Inloggen" : "Aanmaken"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}