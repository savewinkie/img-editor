"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const BG = "#1C1917";
const BG2 = "#231F1C";
const BORDER = "rgba(250,247,242,0.08)";

interface HistoryItem {
  id: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  crop_mode: string;
  created_at: string;
  image_url: string | null;
}

export default function History() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUser(user);
      const { data } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    });
  }, []);

  const deleteItem = async (id: string) => {
    setDeleting(id);
    await supabase.from("history").delete().eq("id", id).eq("user_id", user.id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(250,247,242,0.3)",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#FAF7F2", fontFamily: "sans-serif", position: "relative" }}>

      {/* Grain */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4 }} />

      {/* Detail modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)" }} onClick={() => setSelected(null)}>
          <div style={{ background: BG, border: `1px solid rgba(250,247,242,0.15)`, padding: 40, maxWidth: 480, width: "90%" }} onClick={(e) => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <p style={{ ...labelStyle, margin: "0 0 8px" }}>Bewerking details</p>
                <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.5px", color: "#FAF7F2", margin: 0, fontFamily: "'Times New Roman', Georgia, serif", wordBreak: "break-all" }}>{selected.filename}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(250,247,242,0.4)", fontSize: 20, cursor: "pointer", marginLeft: 16 }}>✕</button>
            </div>

            {selected.image_url && (
              <img src={selected.image_url} alt={selected.filename}
                style={{ width: "100%", maxHeight: 200, objectFit: "cover", marginBottom: 24, opacity: 0.9 }} />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Afmetingen", value: `${selected.width} × ${selected.height}px` },
                { label: "Formaat", value: selected.format.toUpperCase() },
                { label: "Crop modus", value: selected.crop_mode },
                { label: "Datum", value: new Date(selected.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) },
              ].map((item) => (
                <div key={item.label} style={{ padding: "12px 16px", background: BG2, border: `1px solid ${BORDER}` }}>
                  <p style={{ ...labelStyle, margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontSize: 14, color: "#FAF7F2", margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Naam veranderen */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ ...labelStyle, margin: "0 0 8px" }}>Naam veranderen</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  defaultValue={selected.filename}
                  id="rename-input"
                  style={{ flex: 1, background: BG2, border: `1px solid rgba(250,247,242,0.1)`, color: "#FAF7F2", padding: "10px 12px", fontSize: 13, outline: "none" }}
                />
                <button
                  onClick={async () => {
                    const newName = (document.getElementById("rename-input") as HTMLInputElement).value.trim();
                    if (!newName) return;
                    await supabase.from("history").update({ filename: newName }).eq("id", selected.id).eq("user_id", user.id);
                    setItems(prev => prev.map(i => i.id === selected.id ? { ...i, filename: newName } : i));
                    setSelected(prev => prev ? { ...prev, filename: newName } : null);
                  }}
                  style={{ padding: "10px 16px", background: "#FAF7F2", color: BG, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
                  Opslaan
                </button>
              </div>
            </div>

            {/* Download + Verwijderen */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                onClick={() => {
                  if (!selected.image_url) return;
                  const a = document.createElement("a");
                  a.href = selected.image_url;
                  a.download = selected.filename;
                  a.target = "_blank";
                  a.click();
                }}
                style={{
                  padding: "12px",
                  background: selected.image_url ? "#FAF7F2" : "rgba(250,247,242,0.06)",
                  color: selected.image_url ? BG : "rgba(250,247,242,0.2)",
                  border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 3,
                  textTransform: "uppercase",
                  cursor: selected.image_url ? "pointer" : "not-allowed",
                }}>
                {selected.image_url ? "Download" : "Geen afbeelding"}
              </button>
              <button
                onClick={() => deleteItem(selected.id)}
                disabled={deleting === selected.id}
                style={{ padding: "12px", background: "transparent", color: "rgba(250,247,242,0.4)", border: `1px solid rgba(250,247,242,0.15)`, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer" }}>
                {deleting === selected.id ? "Verwijderen..." : "Verwijderen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ position: "relative", zIndex: 2, padding: "20px 48px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: BG }}>
        <a href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-1px", color: "#FAF7F2", textDecoration: "none" }}>IMAGE-TOOLZ</a>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <span style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Geschiedenis</span>
        </div>
        <a href="/" style={{ padding: "8px 20px", border: `1px solid rgba(250,247,242,0.15)`, color: "rgba(250,247,242,0.4)", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", textDecoration: "none" }}>
          ← Terug
        </a>
      </header>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "48px 48px" }}>

        {/* Niet ingelogd */}
        {!loading && !user && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ ...labelStyle, marginBottom: 16 }}>Toegang geweigerd</p>
            <h2 style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-1.5px", color: "#FAF7F2", margin: "0 0 16px", fontFamily: "'Times New Roman', Georgia, serif" }}>
              Log in om je<br /><em style={{ color: "rgba(250,247,242,0.35)" }}>geschiedenis</em> te zien
            </h2>
            <p style={{ fontSize: 14, color: "rgba(250,247,242,0.4)", margin: "0 0 32px" }}>Je hebt een account nodig om je bewerkingen op te slaan.</p>
            <button onClick={() => window.location.href = "/login"}
              style={{ padding: "14px 40px", background: "#FAF7F2", color: BG, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer" }}>
              Inloggen
            </button>
          </div>
        )}

        {/* Laden */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Laden...</p>
          </div>
        )}

        {/* Leeg */}
        {!loading && user && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ ...labelStyle, marginBottom: 16 }}>Geen bewerkingen</p>
            <h2 style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-1.5px", color: "#FAF7F2", margin: "0 0 16px", fontFamily: "'Times New Roman', Georgia, serif" }}>
              Nog geen<br /><em style={{ color: "rgba(250,247,242,0.35)" }}>geschiedenis</em>
            </h2>
            <p style={{ fontSize: 14, color: "rgba(250,247,242,0.4)", margin: "0 0 32px" }}>Download een afbeelding via de resizer om je geschiedenis op te bouwen.</p>
            <button onClick={() => window.location.href = "/"}
              style={{ padding: "14px 40px", background: "#FAF7F2", color: BG, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer" }}>
              Naar resizer
            </button>
          </div>
        )}

        {/* Geschiedenis tabel */}
        {!loading && user && items.length > 0 && (
          <>
            <div style={{ marginBottom: 40 }}>
              <p style={{ ...labelStyle, margin: "0 0 12px" }}>Jouw bewerkingen</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <h1 style={{ fontSize: 48, fontWeight: 400, letterSpacing: "-2px", margin: 0, color: "#FAF7F2", fontFamily: "'Times New Roman', Georgia, serif" }}>
                  Geschiedenis
                </h1>
                <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>{items.length} bewerkingen</span>
              </div>
            </div>

            {/* Tabel header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 40px", gap: 16, padding: "12px 16px", borderBottom: `1px solid rgba(250,247,242,0.12)`, marginBottom: 4 }}>
              {["Bestand", "Afmetingen", "Formaat", "Datum", ""].map((h) => (
                <span key={h} style={labelStyle}>{h}</span>
              ))}
            </div>

            {/* Rijen */}
            {items.map((item) => (
              <div key={item.id}
                onClick={() => setSelected(item)}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 40px", gap: 16, padding: "16px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(250,247,242,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.filename} style={{ width: 36, height: 36, objectFit: "cover", flexShrink: 0, opacity: 0.8 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, background: BG2, border: `1px solid ${BORDER}`, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 13, color: "#FAF7F2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.filename}</span>
                </div>

                <span style={{ fontSize: 13, color: "rgba(250,247,242,0.5)", alignSelf: "center" }}>{item.width} × {item.height}</span>
                <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)", alignSelf: "center", letterSpacing: 2, textTransform: "uppercase" }}>{item.format}</span>
                <span style={{ fontSize: 12, color: "rgba(250,247,242,0.35)", alignSelf: "center" }}>
                  {new Date(item.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                </span>

                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                  disabled={deleting === item.id}
                  style={{ background: "none", border: "none", color: "rgba(250,247,242,0.2)", cursor: "pointer", fontSize: 14, alignSelf: "center", padding: 0, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(250,247,242,0.6)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(250,247,242,0.2)")}>
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}