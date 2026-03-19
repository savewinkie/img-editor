"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";

type Tool = "filter" | "adjust" | "transform" | "border" | "text" | "sticker";

const FREE_LIMIT = 3;
const WARN_AT = 2;
const BG = "#1C1917";
const BG2 = "#231F1C";
const BORDER = "rgba(250,247,242,0.08)";

const FILTERS = [
  { name: "Origineel", filter: "none" },
  { name: "Warm", filter: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { name: "Koel", filter: "hue-rotate(30deg) saturate(0.9) brightness(1.05)" },
  { name: "Vintage", filter: "sepia(0.5) contrast(0.85) brightness(0.95) saturate(0.8)" },
  { name: "Zwart-wit", filter: "grayscale(1)" },
  { name: "Helder", filter: "brightness(1.3) contrast(1.1)" },
  { name: "Dramatisch", filter: "contrast(1.4) saturate(1.3) brightness(0.9)" },
  { name: "Fade", filter: "opacity(0.85) brightness(1.1) saturate(0.7)" },
  { name: "Boost", filter: "saturate(1.8) contrast(1.1)" },
];

const FONTS = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Impact", value: "Impact, sans-serif" },
  { name: "Courier", value: "Courier New, monospace" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif", google: true },
  { name: "Montserrat", value: "Montserrat, sans-serif", google: true },
  { name: "Playfair Display", value: "Playfair Display, serif", google: true },
  { name: "Oswald", value: "Oswald, sans-serif", google: true },
  { name: "Poppins", value: "Poppins, sans-serif", google: true },
  { name: "Dancing Script", value: "Dancing Script, cursive", google: true },
  { name: "Pacifico", value: "Pacifico, cursive", google: true },
  { name: "Lobster", value: "Lobster, cursive", google: true },
  { name: "Bebas Neue", value: "Bebas Neue, cursive", google: true },
  { name: "Bangers", value: "Bangers, cursive", google: true },
  { name: "Permanent Marker", value: "Permanent Marker, cursive", google: true },
  { name: "Satisfy", value: "Satisfy, cursive", google: true },
  { name: "Great Vibes", value: "Great Vibes, cursive", google: true },
];

const STICKERS = [
  "😀","😂","😍","🥰","😎","🤩","😢","😡","🥳","🤔",
  "👍","👎","❤️","🔥","⭐","🎉","🎨","🌈","🌟","💫",
  "🦋","🌸","🍀","🌙","☀️","⚡","🎵","🎶","🏆","💎",
  "🐶","🐱","🦊","🐼","🦁","🐸","🦄","🐙","🌺","🎭",
];

const BORDER_STYLES = [
  { name: "Geen", value: "none" },
  { name: "Dun wit", value: "4px solid #FAF7F2" },
  { name: "Dik wit", value: "12px solid #FAF7F2" },
  { name: "Zwart", value: "12px solid #1C1917" },
  { name: "Goud", value: "8px solid #C9A84C" },
  { name: "Gestippeld", value: "4px dashed #FAF7F2" },
  { name: "Dubbel", value: "6px double #FAF7F2" },
  { name: "Grijs", value: "8px solid #444" },
];

const googleFontUrl = `https://fonts.googleapis.com/css2?family=${FONTS.filter(f => f.google).map(f => f.name.replace(/ /g, '+')).join('&family=')}&display=swap`;

interface StickerItem {
  id: string;
  type: "emoji" | "image";
  emoji?: string;
  imageUrl?: string;
  x: number;
  y: number;
  size: number;
  width: number;
  height: number;
  rotation: number;
}

export default function Editor() {
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("afbeelding");
  const [activeTool, setActiveTool] = useState<Tool>("filter");
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [borderStyle, setBorderStyle] = useState("none");
  const [texts, setTexts] = useState<{ id: string; text: string; x: number; y: number; size: number; color: string; font: string }[]>([]);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#FAF7F2");
  const [textSize, setTextSize] = useState(32);
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [stickerSize, setStickerSize] = useState(48);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [draggingUpload, setDraggingUpload] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
  const [autoEnhancing, setAutoEnhancing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const filteredFonts = FONTS.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()));
  const selectedStickerObj = stickers.find(s => s.id === selectedSticker);
  const remaining = Math.max(0, FREE_LIMIT - downloadCount);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const saved = parseInt(localStorage.getItem("brons_downloads") || "0");
    setDownloadCount(saved);
  }, []);

  const getFilter = () => {
    const base = FILTERS[selectedFilter].filter;
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) opacity(${opacity}%)`;
    return base === "none" ? adjustments : `${base} ${adjustments}`;
  };

  const getImgTransform = () => {
    const parts = [];
    if (flipH) parts.push("scaleX(-1)");
    if (flipV) parts.push("scaleY(-1)");
    parts.push(`rotate(${rotation}deg)`);
    return parts.join(" ");
  };

  const addFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
      const img = new Image();
      img.src = base64;
      img.onload = () => { imgRef.current = img; };
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggingUpload(false);
    const file = e.dataTransfer.files[0];
    if (file) addFile(file);
  }, []);

  const addImageSticker = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const id = Math.random().toString(36).slice(2);
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight;
        const w = 150, h = w / aspect;
        setStickers((prev) => [...prev, { id, type: "image", imageUrl: base64, x: 100, y: 100, size: 150, width: w, height: h, rotation: 0 }]);
        setSelectedSticker(id);
      };
    };
    reader.readAsDataURL(file);
  };

  const autoEnhance = () => {
    setAutoEnhancing(true);
    setBrightness(108); setContrast(110); setSaturation(115);
    setTimeout(() => setAutoEnhancing(false), 800);
  };

  const startDragItem = (e: React.MouseEvent, id: string, currentX: number, currentY: number, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    e.preventDefault(); e.stopPropagation();
    const rect = canvasAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX - rect.left - currentX;
    const startY = e.clientY - rect.top - currentY;
    const move = (me: MouseEvent) => {
      const r = canvasAreaRef.current?.getBoundingClientRect();
      if (!r) return;
      setter((prev: any[]) => prev.map((item) => item.id === id ? { ...item, x: me.clientX - r.left - startX, y: me.clientY - r.top - startY } : item));
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startResize = (e: React.MouseEvent, s: StickerItem) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY, startW = s.width, startH = s.height;
    const move = (me: MouseEvent) => {
      setStickers(prev => prev.map(item => item.id === s.id ? { ...item, width: Math.max(30, startW + (me.clientX - startX)), height: Math.max(30, startH + (me.clientY - startY)) } : item));
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const download = async () => {
    if (!imgRef.current) return;
    if (!user && downloadCount >= FREE_LIMIT) { setShowBlockedModal(true); return; }

    const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
    const imgRect = imgElementRef.current?.getBoundingClientRect();
    const offsetX = imgRect && canvasRect ? imgRect.left - canvasRect.left : 0;
    const offsetY = imgRect && canvasRect ? imgRect.top - canvasRect.top : 0;
    const displayW = imgRect?.width || 1, displayH = imgRect?.height || 1;
    const naturalW = imgRef.current.naturalWidth, naturalH = imgRef.current.naturalHeight;
    const scaleX = naturalW / displayW, scaleY = naturalH / displayH;

    const canvas = document.createElement("canvas");
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    canvas.width = naturalW * cos + naturalH * sin;
    canvas.height = naturalW * sin + naturalH * cos;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = getFilter();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.rotate(rad);
    ctx.drawImage(imgRef.current, -naturalW / 2, -naturalH / 2);
    ctx.filter = "none";
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    texts.forEach((t) => {
      ctx.font = `bold ${t.size * scaleX}px ${t.font}`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x * scaleX, t.y * scaleY);
    });

    for (const s of stickers) {
      ctx.save();
      const sx = (s.x - offsetX) * scaleX + (s.width * scaleX) / 2;
      const sy = (s.y - offsetY) * scaleY + (s.height * scaleY) / 2;
      ctx.translate(sx, sy);
      ctx.rotate((s.rotation * Math.PI) / 180);
      if (s.type === "emoji") {
        ctx.font = `${s.size * scaleX}px serif`;
        ctx.fillText(s.emoji!, -(s.size * scaleX) / 2, (s.size * scaleX) / 2);
      } else if (s.type === "image" && s.imageUrl) {
        await new Promise<void>((resolve) => {
          const stickerImg = new Image();
          stickerImg.onload = () => { ctx.drawImage(stickerImg, -(s.width * scaleX) / 2, -(s.height * scaleY) / 2, s.width * scaleX, s.height * scaleY); resolve(); };
          stickerImg.onerror = () => resolve();
          stickerImg.src = s.imageUrl!;
        });
      }
      ctx.restore();
    }

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${imageName}_bewerkt.png`;
    a.click();

    if (!user) {
      const newCount = downloadCount + 1;
      localStorage.setItem("brons_downloads", newCount.toString());
      setDownloadCount(newCount);
      if (newCount >= WARN_AT) setShowLimitBanner(true);
    }
  };

  const addText = () => {
    if (!newText.trim()) return;
    setTexts((prev) => [...prev, { id: Math.random().toString(36).slice(2), text: newText, x: 50, y: 80, size: textSize, color: textColor, font: textFont }]);
    setNewText("");
  };

  const addSticker = (emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    setStickers((prev) => [...prev, { id, type: "emoji", emoji, x: 100, y: 100, size: stickerSize, width: stickerSize, height: stickerSize, rotation: 0 }]);
    setSelectedSticker(id);
  };

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: "filter", label: "Filters", icon: "◐" },
    { id: "adjust", label: "Aanpassen", icon: "◈" },
    { id: "transform", label: "Spiegelen", icon: "⇔" },
    { id: "border", label: "Kader", icon: "▣" },
    { id: "text", label: "Tekst", icon: "T" },
    { id: "sticker", label: "Stickers", icon: "☺" },
  ];

  const inputStyle: React.CSSProperties = {
    background: BG2, color: "#FAF7F2",
    border: `1px solid rgba(250,247,242,0.1)`, borderRadius: 2,
    padding: "8px 12px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(250,247,242,0.3)",
  };

  return (
    <>
      <link rel="stylesheet" href={googleFontUrl} />
      <div className="min-h-screen flex flex-col" style={{ background: BG, fontFamily: "sans-serif", color: "#FAF7F2" }}>

        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4 }} />

        {showBlockedModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)" }} onClick={() => setShowBlockedModal(false)}>
            <div style={{ background: BG, border: `1px solid rgba(250,247,242,0.15)`, padding: 48, maxWidth: 440, width: "90%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "rgba(250,247,242,0.3)", marginBottom: 16 }}>Limiet bereikt</p>
              <h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-1px", color: "#FAF7F2", margin: "0 0 16px", fontFamily: "'Times New Roman', Georgia, serif" }}>Je gratis downloads zijn op</h2>
              <p style={{ fontSize: 14, color: "rgba(250,247,242,0.5)", lineHeight: 1.7, margin: "0 0 32px" }}>Je hebt je {FREE_LIMIT} gratis downloads gebruikt. Log in voor onbeperkt downloaden — helemaal gratis.</p>
              <button onClick={() => window.location.href = "/login"} style={{ width: "100%", padding: "16px", background: "#FAF7F2", color: BG, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", marginBottom: 12 }}>Inloggen voor meer downloads</button>
              <button onClick={() => setShowBlockedModal(false)} style={{ background: "none", border: "none", fontSize: 11, color: "rgba(250,247,242,0.3)", cursor: "pointer", letterSpacing: 2, textTransform: "uppercase" }}>Sluiten</button>
            </div>
          </div>
        )}

        {showLimitBanner && !user && remaining > 0 && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: BG2, borderTop: `1px solid rgba(250,247,242,0.12)`, padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C9A84C" }} />
              <p style={{ fontSize: 13, color: "rgba(250,247,242,0.7)", margin: 0 }}>
                Je hebt nog <strong style={{ color: "#FAF7F2" }}>{remaining} gratis download{remaining !== 1 ? "s" : ""}</strong> over.{" "}
                <span style={{ color: "rgba(250,247,242,0.4)" }}>Log in voor onbeperkt downloaden.</span>
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button onClick={() => window.location.href = "/login"} style={{ padding: "8px 24px", background: "#FAF7F2", color: BG, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>Inloggen</button>
              <button onClick={() => setShowLimitBanner(false)} style={{ background: "none", border: "none", color: "rgba(250,247,242,0.3)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
          </div>
        )}

        <header style={{ position: "relative", zIndex: 2, padding: "20px 48px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: BG }}>
          <a href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-1px", color: "#FAF7F2", textDecoration: "none" }}>BRONS-CO</a>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <span style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Tool — 02 · Image Editor</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {!user && <span style={{ fontSize: 11, letterSpacing: 2, color: "rgba(250,247,242,0.3)" }}>{remaining} download{remaining !== 1 ? "s" : ""} over</span>}
            {image && (user || downloadCount < FREE_LIMIT) && (
              <button onClick={download} style={{ padding: "8px 24px", background: "#FAF7F2", color: BG, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 3, textTransform: "uppercase" }}>Download</button>
            )}
            {image && !user && downloadCount >= FREE_LIMIT && (
              <button onClick={() => setShowBlockedModal(true)} style={{ padding: "8px 24px", background: "rgba(250,247,242,0.08)", color: "rgba(250,247,242,0.4)", border: `1px solid rgba(250,247,242,0.1)`, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 3, textTransform: "uppercase" }}>Inloggen vereist</button>
            )}
            <a href="/" style={{ padding: "8px 20px", border: `1px solid rgba(250,247,242,0.15)`, color: "rgba(250,247,242,0.4)", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", textDecoration: "none" }}>← Terug</a>
          </div>
        </header>

        {!image ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, position: "relative", zIndex: 1 }}>
            <div onDragOver={(e) => { e.preventDefault(); setDraggingUpload(true); }} onDragLeave={() => setDraggingUpload(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()}
              style={{ border: draggingUpload ? "1px solid rgba(250,247,242,0.6)" : `1px solid rgba(250,247,242,0.12)`, borderRadius: 4, padding: "80px 60px", maxWidth: 480, width: "100%", textAlign: "center", cursor: "pointer", background: draggingUpload ? "rgba(250,247,242,0.04)" : "transparent", transition: "all 0.2s" }}>
              <div style={{ fontSize: 44, marginBottom: 16, color: "rgba(250,247,242,0.3)" }}>+</div>
              <p style={{ fontSize: 16, fontWeight: 400, color: "#FAF7F2", marginBottom: 8 }}>Sleep een afbeelding hierheen</p>
              <p style={{ fontSize: 11, color: "rgba(250,247,242,0.3)", letterSpacing: 3, textTransform: "uppercase" }}>of klik om te bladeren</p>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])} />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>

            <div style={{ width: 72, background: BG, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 2, padding: 8 }}>
              {tools.map((tool) => (
                <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", border: "none", cursor: "pointer", background: activeTool === tool.id ? "rgba(250,247,242,0.08)" : "transparent", color: activeTool === tool.id ? "#FAF7F2" : "rgba(250,247,242,0.3)", transition: "all 0.15s", borderRadius: 2 }}>
                  <span style={{ fontSize: 18 }}>{tool.icon}</span>
                  <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>{tool.label}</span>
                </button>
              ))}
            </div>

            <div ref={canvasAreaRef} onClick={() => setSelectedSticker(null)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, overflow: "auto", background: BG2, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(250,247,242,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(250,247,242,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

              <div style={{ position: "relative", transform: getImgTransform(), border: borderStyle === "none" ? "none" : borderStyle, display: "inline-block", boxShadow: "0 20px 80px rgba(0,0,0,0.4)" }}>
                <img ref={imgElementRef} src={image} alt="bewerkt" style={{ maxWidth: "60vw", maxHeight: "65vh", filter: getFilter(), display: "block" }} />
                {texts.map((t) => (
                  <div key={t.id} onMouseDown={(e) => startDragItem(e, t.id, t.x, t.y, setTexts)}
                    style={{ position: "absolute", top: t.y, left: t.x, color: t.color, fontSize: t.size, fontFamily: t.font, fontWeight: "bold", textShadow: "0 2px 8px rgba(0,0,0,0.8)", cursor: "move", userSelect: "none", whiteSpace: "nowrap" }}>
                    {t.text}
                    <button onClick={(e) => { e.stopPropagation(); setTexts((prev) => prev.filter((item) => item.id !== t.id)); }}
                      style={{ position: "absolute", top: -8, right: -8, background: "#FAF7F2", color: BG, border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", lineHeight: "18px" }}>✕</button>
                  </div>
                ))}
              </div>

              {stickers.map((s) => (
                <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSticker(s.id); }} onMouseDown={(e) => startDragItem(e, s.id, s.x, s.y, setStickers)}
                  style={{ position: "absolute", left: s.x, top: s.y, width: s.width, height: s.type === "emoji" ? s.size : s.height, cursor: "move", userSelect: "none", transform: `rotate(${s.rotation}deg)`, outline: selectedSticker === s.id ? "1px solid rgba(250,247,242,0.5)" : "none", borderRadius: 2 }}>
                  {s.type === "emoji" ? <span style={{ fontSize: s.size, lineHeight: 1, display: "block" }}>{s.emoji}</span> : <img src={s.imageUrl} alt="sticker" style={{ width: s.width, height: s.height, display: "block", objectFit: "fill" }} draggable={false} />}
                  <button onClick={(e) => { e.stopPropagation(); setStickers((prev) => prev.filter((item) => item.id !== s.id)); setSelectedSticker(null); }}
                    style={{ position: "absolute", top: -8, right: -8, background: "#FAF7F2", color: BG, border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", lineHeight: "18px", textAlign: "center" }}>✕</button>
                  {selectedSticker === s.id && (
                    <div onMouseDown={(e) => startResize(e, s)} style={{ position: "absolute", bottom: -6, right: -6, width: 14, height: 14, background: "#FAF7F2", borderRadius: "50%", cursor: "se-resize", border: `2px solid ${BG}` }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ width: 290, background: BG, borderLeft: `1px solid ${BORDER}`, padding: 20, overflowY: "auto" }}>

              {activeTool === "filter" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={labelStyle}>Filters</p>
                  <button onClick={autoEnhance} style={{ width: "100%", padding: "10px", border: `1px solid rgba(250,247,242,0.15)`, background: autoEnhancing ? "#FAF7F2" : "transparent", color: autoEnhancing ? BG : "rgba(250,247,242,0.6)", fontSize: 10, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s" }}>
                    {autoEnhancing ? "✓ Verbeterd!" : "✨ Auto verbeteren"}
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {FILTERS.map((f, i) => (
                      <button key={i} onClick={() => setSelectedFilter(i)} style={{ border: selectedFilter === i ? "1px solid rgba(250,247,242,0.6)" : `1px solid rgba(250,247,242,0.08)`, borderRadius: 2, background: "transparent", padding: 6, cursor: "pointer" }}>
                        <div style={{ height: 56, borderRadius: 2, overflow: "hidden", filter: f.filter === "none" ? "none" : f.filter }}>
                          <img src={image} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <p style={{ fontSize: 10, color: "rgba(250,247,242,0.4)", margin: "6px 0 2px", textAlign: "center", letterSpacing: 1, textTransform: "uppercase" }}>{f.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === "adjust" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <p style={labelStyle}>Aanpassingen</p>
                  {[
                    { label: "Helderheid", value: brightness, setValue: setBrightness },
                    { label: "Contrast", value: contrast, setValue: setContrast },
                    { label: "Verzadiging", value: saturation, setValue: setSaturation },
                    { label: "Transparantie", value: opacity, setValue: setOpacity },
                  ].map((adj) => (
                    <div key={adj.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={labelStyle}>{adj.label}</span>
                        <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)" }}>{adj.value}%</span>
                      </div>
                      <input type="range" min="0" max="200" value={adj.value} onChange={(e) => adj.setValue(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#FAF7F2" }} />
                      <button onClick={() => adj.setValue(100)} style={{ fontSize: 10, color: "rgba(250,247,242,0.2)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, letterSpacing: 2, textTransform: "uppercase" }}>Reset</button>
                    </div>
                  ))}
                </div>
              )}

              {activeTool === "transform" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <p style={labelStyle}>Spiegelen & Roteren</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={() => setFlipH(!flipH)} style={{ padding: "10px", background: flipH ? "rgba(250,247,242,0.1)" : "transparent", color: flipH ? "#FAF7F2" : "rgba(250,247,242,0.4)", border: `1px solid rgba(250,247,242,0.1)`, cursor: "pointer", fontSize: 12 }}>↔ Horizontaal</button>
                    <button onClick={() => setFlipV(!flipV)} style={{ padding: "10px", background: flipV ? "rgba(250,247,242,0.1)" : "transparent", color: flipV ? "#FAF7F2" : "rgba(250,247,242,0.4)", border: `1px solid rgba(250,247,242,0.1)`, cursor: "pointer", fontSize: 12 }}>↕ Verticaal</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[{ label: "↺ 90°", value: -90 }, { label: "↻ 90°", value: 90 }, { label: "180°", value: 180 }, { label: "Reset", value: 0 }].map((r) => (
                      <button key={r.label} onClick={() => setRotation((prev) => r.value === 0 ? 0 : (prev + r.value) % 360)} style={{ padding: "10px", background: "transparent", border: `1px solid rgba(250,247,242,0.1)`, color: "rgba(250,247,242,0.5)", fontSize: 12, cursor: "pointer" }}>{r.label}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={labelStyle}>Vrij roteren</span>
                      <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)" }}>{rotation}°</span>
                    </div>
                    <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#FAF7F2" }} />
                  </div>
                </div>
              )}

              {activeTool === "border" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={labelStyle}>Kaders</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {BORDER_STYLES.map((b) => (
                      <button key={b.name} onClick={() => setBorderStyle(b.value)} style={{ textAlign: "left", padding: "10px 14px", cursor: "pointer", background: borderStyle === b.value ? "rgba(250,247,242,0.08)" : "transparent", color: borderStyle === b.value ? "#FAF7F2" : "rgba(250,247,242,0.4)", border: borderStyle === b.value ? `1px solid rgba(250,247,242,0.25)` : `1px solid rgba(250,247,242,0.06)`, fontSize: 13 }}>{b.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === "text" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={labelStyle}>Tekst</p>
                  <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Typ je tekst..." onKeyDown={(e) => e.key === "Enter" && addText()} style={inputStyle} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={labelStyle}>Font</span>
                    <input type="text" value={fontSearch} onChange={(e) => setFontSearch(e.target.value)} placeholder="Zoek font..." style={inputStyle} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 160, overflowY: "auto", border: `1px solid rgba(250,247,242,0.08)`, background: BG2 }}>
                      {filteredFonts.map((f) => (
                        <button key={f.name} onClick={() => setTextFont(f.value)} style={{ textAlign: "left", padding: "8px 12px", background: textFont === f.value ? "rgba(250,247,242,0.1)" : "transparent", color: textFont === f.value ? "#FAF7F2" : "rgba(250,247,242,0.4)", border: "none", cursor: "pointer", fontSize: 14, fontFamily: f.value }}>{f.name}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={labelStyle}>Grootte</span>
                      <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)" }}>{textSize}px</span>
                    </div>
                    <input type="range" min="12" max="120" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#FAF7F2" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={labelStyle}>Kleur</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["#FAF7F2", "#1C1917", "#ffffff", "#C9A84C", "#ff4444", "#44aaff", "#44ff88", "#ffdd44", "#ff44aa"].map((c) => (
                        <button key={c} onClick={() => setTextColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: textColor === c ? "3px solid #FAF7F2" : `2px solid rgba(250,247,242,0.1)`, cursor: "pointer" }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", border: `1px solid rgba(250,247,242,0.08)`, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", background: BG2 }}>
                    <span style={{ fontFamily: textFont, fontSize: Math.min(textSize, 26), color: textColor, fontWeight: "bold" }}>{newText || "Preview"}</span>
                  </div>
                  <button onClick={addText} disabled={!newText.trim()} style={{ width: "100%", padding: "12px", border: "none", background: newText.trim() ? "#FAF7F2" : "rgba(250,247,242,0.08)", color: newText.trim() ? BG : "rgba(250,247,242,0.2)", fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: newText.trim() ? "pointer" : "not-allowed" }}>Toevoegen</button>
                  {texts.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={labelStyle}>Toegevoegd</span>
                      {texts.map((t) => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: `1px solid rgba(250,247,242,0.06)`, background: BG2 }}>
                          <span style={{ fontSize: 13, color: "rgba(250,247,242,0.6)", fontFamily: t.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</span>
                          <button onClick={() => setTexts((prev) => prev.filter((item) => item.id !== t.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(250,247,242,0.2)", fontSize: 12, marginLeft: 8 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTool === "sticker" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={labelStyle}>Stickers</p>
                  <button onClick={() => stickerInputRef.current?.click()} style={{ width: "100%", padding: "12px", border: "1px dashed rgba(250,247,242,0.2)", background: "transparent", color: "rgba(250,247,242,0.5)", fontSize: 11, cursor: "pointer", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(250,247,242,0.5)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(250,247,242,0.2)")}>
                    + Eigen afbeelding
                  </button>
                  <input ref={stickerInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && addImageSticker(e.target.files[0])} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={labelStyle}>Emoji grootte</span>
                      <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)" }}>{stickerSize}px</span>
                    </div>
                    <input type="range" min="20" max="120" value={stickerSize} onChange={(e) => setStickerSize(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#FAF7F2" }} />
                  </div>
                  {selectedStickerObj && (
                    <div style={{ padding: "12px", border: `1px solid rgba(250,247,242,0.1)`, background: BG2, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={labelStyle}>Geselecteerd</span>
                        {selectedStickerObj.type === "emoji" ? <span style={{ fontSize: 22 }}>{selectedStickerObj.emoji}</span> : <img src={selectedStickerObj.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: "cover" }} />}
                      </div>
                      {[
                        { label: "Rotatie", min: -180, max: 180, val: selectedStickerObj.rotation, set: (v: number) => setStickers(prev => prev.map(s => s.id === selectedSticker ? { ...s, rotation: v } : s)), suffix: "°" },
                        { label: "Breedte", min: 20, max: 600, val: Math.round(selectedStickerObj.width), set: (v: number) => setStickers(prev => prev.map(s => s.id === selectedSticker ? { ...s, width: v } : s)), suffix: "px" },
                        { label: "Hoogte", min: 20, max: 600, val: Math.round(selectedStickerObj.height), set: (v: number) => setStickers(prev => prev.map(s => s.id === selectedSticker ? { ...s, height: v } : s)), suffix: "px" },
                      ].map((ctrl) => (
                        <div key={ctrl.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={labelStyle}>{ctrl.label}</span>
                            <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)" }}>{ctrl.val}{ctrl.suffix}</span>
                          </div>
                          <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.val} onChange={(e) => ctrl.set(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#FAF7F2" }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {!user && (
                    <div style={{ padding: "12px", border: `1px solid rgba(250,247,242,0.08)`, background: BG2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={labelStyle}>Gratis downloads</span>
                        <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)" }}>{downloadCount}/{FREE_LIMIT}</span>
                      </div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                          <div key={i} style={{ flex: 1, height: 3, background: i < downloadCount ? "rgba(250,247,242,0.15)" : "#FAF7F2", borderRadius: 2 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                    {STICKERS.map((emoji, index) => (
                      <button key={index} onClick={() => addSticker(emoji)} style={{ fontSize: 22, padding: "8px", border: `1px solid rgba(250,247,242,0.06)`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(250,247,242,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {stickers.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={labelStyle}>Toegevoegd</span>
                      {stickers.map((s) => (
                        <div key={s.id} onClick={() => setSelectedSticker(s.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: selectedSticker === s.id ? `1px solid rgba(250,247,242,0.3)` : `1px solid rgba(250,247,242,0.06)`, background: selectedSticker === s.id ? "rgba(250,247,242,0.06)" : "transparent", cursor: "pointer" }}>
                          {s.type === "emoji" ? <span style={{ fontSize: 20 }}>{s.emoji}</span> : <img src={s.imageUrl} alt="" style={{ width: 24, height: 24, objectFit: "cover" }} />}
                          <button onClick={(e) => { e.stopPropagation(); setStickers((prev) => prev.filter((item) => item.id !== s.id)); setSelectedSticker(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(250,247,242,0.2)", fontSize: 12 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}