"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface historyItem {
  id: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  crop_mode: string;
  created_at: string;
}

export default function history() {
  const [history, sethistory] = useState<historyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selected, setSelected] = useState<historyItem | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("history")
          .select("*")
          .order("created_at", { ascending: false });
        sethistory(data || []);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleEdit = (item: historyItem) => {
    const params = new URLSearchParams({
      width: item.width.toString(),
      height: item.height.toString(),
      format: item.format,
      crop_mode: item.crop_mode,
    });
    window.location.href = `/?${params.toString()}`;
  };

  const handleDelete = async (id: string) => {
    await supabase.from("history").delete().eq("id", id);
    sethistory((prev) => prev.filter((item) => item.id !== id));
    setSelected(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF7F2" }}>
      <p style={{ color: "#B8A690" }}>Laden...</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#FAF7F2" }}>
      <p className="text-lg font-medium" style={{ color: "#2A2016" }}>Je moet ingelogd zijn om je geschiedenis te zien</p>
      <a href="/login" className="px-6 py-2 rounded-full text-white text-sm font-medium" style={{ background: "#8B6F47" }}>
        Inloggen
      </a>
    </div>
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FAF7F2" }}>

      {/* Detail popup */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(42,32,18,0.85)" }} onClick={() => setSelected(null)}>
          <div className="max-w-md w-full p-6 rounded-2xl" style={{ background: "#FDF9F4", border: "1px solid #E8DFD0" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg" style={{ color: "#2A2016" }}>Details</h3>
              <button onClick={() => setSelected(null)} className="hover:opacity-50 transition-opacity text-xl" style={{ color: "#2A2016" }}>✕</button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between py-2" style={{ borderBottom: "1px solid #E8DFD0" }}>
                <span className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Bestandsnaam</span>
                <span className="text-sm font-medium" style={{ color: "#2A2016" }}>{selected.filename}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: "1px solid #E8DFD0" }}>
                <span className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Afmetingen</span>
                <span className="text-sm font-medium" style={{ color: "#2A2016" }}>{selected.width} × {selected.height}px</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: "1px solid #E8DFD0" }}>
                <span className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Formaat</span>
                <span className="text-sm font-medium" style={{ color: "#2A2016" }}>{selected.format.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: "1px solid #E8DFD0" }}>
                <span className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Modus</span>
                <span className="text-sm font-medium" style={{ color: "#2A2016" }}>{selected.crop_mode}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Datum</span>
                <span className="text-sm font-medium" style={{ color: "#2A2016" }}>{new Date(selected.created_at).toLocaleDateString("nl-NL")}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(selected)}
                className="flex-1 text-white text-sm font-medium py-3 tracking-widest uppercase rounded-full hover:opacity-90 transition-all"
                style={{ background: "#8B6F47" }}>
                Bewerken
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-4 py-3 rounded-full text-sm font-medium hover:opacity-80 transition-all"
                style={{ border: "1px solid #E8DFD0", color: "#B8A690" }}>
                🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #E8DFD0" }}>
        <a href="/" className="text-2xl font-bold tracking-tighter" style={{ color: "#2A2016" }}>BRONS-CO</a>
        <a href="/" className="text-sm hover:opacity-60 transition-opacity" style={{ color: "#8B6F47" }}>← Terug</a>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#2A2016" }}>Geschiedenis</h1>
          <span className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>{history.length} items</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#B8A690" }}>
            <p className="text-4xl mb-4">📂</p>
            <p>Nog geen afbeeldingen bewerkt</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className="p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:opacity-80"
                style={{ border: "1px solid #E8DFD0", background: "#FDF9F4" }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "#F0EAE0" }}>🖼️</div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#2A2016" }}>{item.filename}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#B8A690" }}>
                      {item.width} × {item.height}px · {item.format.toUpperCase()} · {item.crop_mode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs" style={{ color: "#B8A690" }}>
                    {new Date(item.created_at).toLocaleDateString("nl-NL")}
                  </p>
                  <span style={{ color: "#B8A690" }}>›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}