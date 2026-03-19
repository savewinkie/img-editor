"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "./lib/supabase";

interface ImageFile {
  id: string;
  file: File;
  url: string;
  name: string;
  cropData?: { x: number; y: number; w: number; h: number };
}

type CropMode = "fill" | "fit" | "stretch" | "none";

function CropPreview({ img, width, height, onClose, onConfirm }: {
  img: ImageFile;
  width: number;
  height: number;
  onClose: () => void;
  onConfirm: (crop: { x: number; y: number; w: number; h: number }) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const action = useRef<null | "move" | "nw" | "ne" | "sw" | "se">(null);
  const dragStart = useRef({ mx: 0, my: 0, crop: { x: 0, y: 0, w: 0, h: 0 } });

  const onLoad = () => {
    const el = imgRef.current!;
    const iw = el.clientWidth, ih = el.clientHeight;
    setImgSize({ w: iw, h: ih });
    const scale = Math.min(iw / (el.naturalWidth || width), ih / (el.naturalHeight || height));
    const cw = Math.min(width * scale, iw), ch = Math.min(height * scale, ih);
    setCrop({ x: (iw - cw) / 2, y: (ih - ch) / 2, w: cw, h: ch });
  };

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const startAction = (e: React.MouseEvent, type: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault(); e.stopPropagation();
    action.current = type;
    dragStart.current = { mx: e.clientX, my: e.clientY, crop: { ...crop } };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!action.current) return;
    const dx = e.clientX - dragStart.current.mx, dy = e.clientY - dragStart.current.my;
    const c = { ...dragStart.current.crop }, minSize = 30;
    if (action.current === "move") setCrop({ ...c, x: clamp(c.x + dx, 0, imgSize.w - c.w), y: clamp(c.y + dy, 0, imgSize.h - c.h) });
    else if (action.current === "se") setCrop({ ...c, w: clamp(c.w + dx, minSize, imgSize.w - c.x), h: clamp(c.h + dy, minSize, imgSize.h - c.y) });
    else if (action.current === "sw") { const newW = clamp(c.w - dx, minSize, c.x + c.w); setCrop({ ...c, x: c.x + c.w - newW, w: newW, h: clamp(c.h + dy, minSize, imgSize.h - c.y) }); }
    else if (action.current === "ne") { const newH = clamp(c.h - dy, minSize, c.y + c.h); setCrop({ ...c, y: c.y + c.h - newH, w: clamp(c.w + dx, minSize, imgSize.w - c.x), h: newH }); }
    else if (action.current === "nw") { const newW = clamp(c.w - dx, minSize, c.x + c.w), newH = clamp(c.h - dy, minSize, c.y + c.h); setCrop({ x: c.x + c.w - newW, y: c.y + c.h - newH, w: newW, h: newH }); }
  };

  const onMouseUp = () => { action.current = null; };

  const handleConfirm = () => {
    const el = imgRef.current!;
    onConfirm({ x: crop.x * (el.naturalWidth / imgSize.w), y: crop.y * (el.naturalHeight / imgSize.h), w: crop.w * (el.naturalWidth / imgSize.w), h: crop.h * (el.naturalHeight / imgSize.h) });
  };

  const handles: { pos: "nw" | "ne" | "sw" | "se"; style: React.CSSProperties }[] = [
    { pos: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
    { pos: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
    { pos: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
    { pos: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <div className="max-w-xl w-full p-6" style={{ background: "#FAF7F2", border: "1px solid #E8DFD0" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>Crop</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#1A1A1A" }}>✕</button>
        </div>
        <div ref={containerRef} className="relative inline-block w-full select-none" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <img ref={imgRef} src={img.url} alt={img.name} onLoad={onLoad} draggable={false} className="w-full object-contain" style={{ maxHeight: 480 }} />
          {crop.w > 0 && (
            <>
              <div className="absolute pointer-events-none" style={{ top: 0, left: 0, right: 0, height: crop.y, background: "rgba(250,247,242,0.75)" }} />
              <div className="absolute pointer-events-none" style={{ top: crop.y + crop.h, left: 0, right: 0, bottom: 0, background: "rgba(250,247,242,0.75)" }} />
              <div className="absolute pointer-events-none" style={{ top: crop.y, left: 0, width: crop.x, height: crop.h, background: "rgba(250,247,242,0.75)" }} />
              <div className="absolute pointer-events-none" style={{ top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h, background: "rgba(250,247,242,0.75)" }} />
              <div onMouseDown={(e) => startAction(e, "move")} className="absolute cursor-move" style={{ top: crop.y, left: crop.x, width: crop.w, height: crop.h, border: "2px solid #1A1A1A" }}>
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)", backgroundSize: `${crop.w / 3}px ${crop.h / 3}px` }} />
                {handles.map(({ pos, style }) => (
                  <div key={pos} onMouseDown={(e) => startAction(e, pos)} className="absolute w-3 h-3 z-10" style={{ ...style, position: "absolute", background: "#1A1A1A" }} />
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ marginTop: 16, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#888", textAlign: "center" }}>
          {Math.round(crop.w)} × {Math.round(crop.h)} — output {width} × {height}px
        </div>
        <button onClick={handleConfirm} style={{ marginTop: 16, width: "100%", padding: "12px", background: "#1A1A1A", color: "#FAF7F2", border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer" }}>
          Bevestigen
        </button>
      </div>
    </div>
  );
}

const FREE_LIMIT = 3;
const WARN_AT = 2;
const BG = "#1C1917";
const BG2 = "#231F1C";
const BORDER = "rgba(250,247,242,0.08)";

type View = "home" | "resizer";

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState<string>("800");
  const [height, setHeight] = useState<string>("600");
  const [quality, setQuality] = useState("85");
  const [format, setFormat] = useState("jpeg");
  const [cropMode, setCropMode] = useState<CropMode>("fill");
  const [processing, setProcessing] = useState(false);
  const [previewImg, setPreviewImg] = useState<ImageFile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showCoffeeMsg, setShowCoffeeMsg] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const saved = parseInt(localStorage.getItem("brons_downloads") || "0");
    setDownloadCount(saved);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("width")) setWidth(params.get("width")!);
    if (params.get("height")) setHeight(params.get("height")!);
    if (params.get("format")) setFormat(params.get("format")!);
    if (params.get("crop_mode")) setCropMode(params.get("crop_mode") as CropMode);
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageFile[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ id: Math.random().toString(36).slice(2), file, url: URL.createObjectURL(file), name: file.name }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const removeImage = (id: string) => setImages((prev) => prev.filter((img) => img.id !== id));

  const saveCrop = (id: string, cropData: { x: number; y: number; w: number; h: number }) => {
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, cropData } : img));
    setPreviewImg(null);
  };

  const processImage = (img: HTMLImageElement, targetW: number, targetH: number, cropData?: { x: number; y: number; w: number; h: number }): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = targetW; canvas.height = targetH;
    const srcW = img.naturalWidth, srcH = img.naturalHeight;
    if (cropData) ctx.drawImage(img, cropData.x, cropData.y, cropData.w, cropData.h, 0, 0, targetW, targetH);
    else if (cropMode === "stretch") ctx.drawImage(img, 0, 0, targetW, targetH);
    else if (cropMode === "fit") {
      const scale = Math.min(targetW / srcW, targetH / srcH);
      const newW = srcW * scale, newH = srcH * scale;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, (targetW - newW) / 2, (targetH - newH) / 2, newW, newH);
    } else if (cropMode === "fill") {
      const scale = Math.max(targetW / srcW, targetH / srcH);
      const newW = srcW * scale, newH = srcH * scale;
      ctx.drawImage(img, (targetW - newW) / 2, (targetH - newH) / 2, newW, newH);
    } else ctx.drawImage(img, 0, 0);
    return canvas;
  };

  const saveToHistory = async (filename: string, file: File) => {
    if (!user) return;
    const filePath = `${user.id}/${Date.now()}_${filename}`;
    const { data: uploadData } = await supabase.storage.from("images").upload(filePath, file, { upsert: true });
    const imageUrl = uploadData?.path ? supabase.storage.from("images").getPublicUrl(uploadData.path).data.publicUrl : null;
    await supabase.from("history").insert({ user_id: user.id, filename, width: parseInt(width), height: parseInt(height), format, crop_mode: cropMode, image_url: imageUrl });
  };

  const processAndDownload = async () => {
    if (images.length === 0) return;
    if (!user && downloadCount >= FREE_LIMIT) { setShowBlockedModal(true); return; }
    setProcessing(true);
    let newCount = downloadCount;
    for (const imgFile of images) {
      const image = new Image();
      image.src = imgFile.url;
      await new Promise((res) => (image.onload = res));
      const targetW = parseInt(width) || image.naturalWidth;
      const targetH = parseInt(height) || image.naturalHeight;
      const canvas = processImage(image, targetW, targetH, imgFile.cropData);
      const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
      const dataUrl = canvas.toDataURL(mime, parseInt(quality) / 100);
      const a = document.createElement("a");
      a.href = dataUrl; a.download = imgFile.name.replace(/\.[^.]+$/, "") + "." + format; a.click();
      await saveToHistory(imgFile.name, imgFile.file);
      await new Promise((res) => setTimeout(res, 200));
      if (!user) newCount++;
    }
    if (!user) {
      localStorage.setItem("brons_downloads", newCount.toString());
      setDownloadCount(newCount);
      if (newCount >= WARN_AT) setShowLimitBanner(true);
    }
    setProcessing(false);
  };

  const remaining = Math.max(0, FREE_LIMIT - downloadCount);

  const cropOptions: { value: CropMode; label: string; desc: string }[] = [
    { value: "fill", label: "Fill", desc: "Vult volledig, snijdt randen weg" },
    { value: "fit", label: "Fit", desc: "Hele foto zichtbaar" },
    { value: "stretch", label: "Stretch", desc: "Uitrekken naar exacte maat" },
    { value: "none", label: "Origineel", desc: "Originele afmetingen behouden" },
  ];

  // ─── HOME ─────────────────────────────────────────────────────────
  if (view === "home") {
    const tools = [
      { id: "resizer", number: "01", title: "Image\nResizer", desc: "Verklein, vergroot of crop meerdere foto's tegelijk naar elke gewenste afmeting.", tag: "BULK · GRATIS", action: () => setView("resizer"), accent: "#FAF7F2" },
      { id: "editor", number: "02", title: "Image\nEditor", desc: "Filters, tekst, stickers, kaders en meer. Professioneel bewerken in de browser.", tag: "EDITOR · TOOLS", action: () => window.location.href = "/editor", accent: "#C9A84C" },
      { id: "coffee", number: "03", title: "Buy Me\na Coffee", desc: "Vind je IMAGE-TOOLZ handig? Steun de ontwikkeling met een kleine donatie.", tag: "SUPPORT · ☕", action: () => setShowCoffeeMsg(true), accent: "#8B6F47" },
    ];

    return (
      <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Times New Roman', Georgia, serif", color: "#FAF7F2", position: "relative", overflow: "hidden" }}>

        {/* Grain */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4 }} />
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(250,247,242,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,247,242,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

        {/* Coffee modal */}
        {showCoffeeMsg && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)" }} onClick={() => setShowCoffeeMsg(false)}>
            <div style={{ background: BG, border: "1px solid rgba(250,247,242,0.15)", padding: 48, maxWidth: 400, width: "90%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "rgba(250,247,242,0.3)", marginBottom: 16, fontFamily: "sans-serif" }}>☕ Donaties</p>
              <h2 style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-1px", color: "#FAF7F2", margin: "0 0 16px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                We're working<br /><em style={{ color: "rgba(250,247,242,0.4)" }}>on it</em>
              </h2>
              <p style={{ fontSize: 14, color: "rgba(250,247,242,0.5)", lineHeight: 1.7, margin: "0 0 32px", fontFamily: "sans-serif" }}>
                Donaties zijn binnenkort beschikbaar. Bedankt voor je interesse in het steunen van IMAGE-TOOLZ!
              </p>
              <button onClick={() => setShowCoffeeMsg(false)} style={{ width: "100%", padding: "14px", background: "#FAF7F2", color: BG, border: "none", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", fontFamily: "sans-serif" }}>
                Sluiten
              </button>
            </div>
          </div>
        )}

        <header style={{ position: "relative", zIndex: 2, padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 13, letterSpacing: 6, textTransform: "uppercase", color: "rgba(250,247,242,0.4)", fontFamily: "sans-serif" }}>Vol. 01</span>
            <span style={{ fontSize: 13, letterSpacing: 6, textTransform: "uppercase", color: "rgba(250,247,242,0.4)", fontFamily: "sans-serif" }}>2026</span>
          </div>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 28, fontWeight: 700, letterSpacing: "-1px", color: "#FAF7F2" }}>IMAGE-TOOLZ</div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {user && <a href="/history" style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.4)", textDecoration: "none", fontFamily: "sans-serif" }}>Geschiedenis</a>}
            <button onClick={() => user ? supabase.auth.signOut().then(() => setUser(null)) : window.location.href = "/login"}
              style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.5)", background: "none", border: `1px solid rgba(250,247,242,0.15)`, padding: "8px 20px", cursor: "pointer", fontFamily: "sans-serif" }}>
              {user ? "Uitloggen" : "Inloggen"}
            </button>
          </div>
        </header>

        <div style={{ position: "relative", zIndex: 2, padding: "60px 48px 0" }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(250,247,242,0.35)", fontFamily: "sans-serif", margin: "0 0 24px" }}>Image Tools — Browser Based</p>
          <h1 style={{ fontSize: "clamp(56px, 9vw, 120px)", fontWeight: 400, letterSpacing: "-3px", lineHeight: 0.9, margin: 0, color: "#FAF7F2" }}>
            Bewerk.<br /><em style={{ fontStyle: "italic", color: "rgba(250,247,242,0.35)" }}>Resize.</em><br />Creëer.
          </h1>
        </div>

        <div style={{ position: "relative", zIndex: 2, margin: "48px 48px 0", borderTop: `1px solid rgba(250,247,242,0.1)`, display: "flex", justifyContent: "space-between", paddingTop: 16 }}>
          <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.25)", fontFamily: "sans-serif" }}>Tools</span>
          <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.25)", fontFamily: "sans-serif" }}>Gratis · No signup</span>
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, margin: "0 48px", borderLeft: `1px solid ${BORDER}` }}>
          {tools.map((tool) => (
            <div key={tool.id} onClick={tool.action} onMouseEnter={() => setHovered(tool.id)} onMouseLeave={() => setHovered(null)}
              style={{ padding: "48px 40px", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, cursor: "pointer", transition: "background 0.3s", background: hovered === tool.id ? "rgba(250,247,242,0.03)" : "transparent", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: tool.accent, transform: hovered === tool.id ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 0.3s ease" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
                <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.25)", fontFamily: "sans-serif" }}>{tool.tag}</span>
                <span style={{ fontSize: 48, fontWeight: 300, color: "rgba(250,247,242,0.08)", lineHeight: 1 }}>{tool.number}</span>
              </div>
              <h2 style={{ fontSize: "clamp(32px, 3vw, 48px)", fontWeight: 400, letterSpacing: "-1.5px", lineHeight: 1, margin: "0 0 20px", color: hovered === tool.id ? tool.accent : "#FAF7F2", transition: "color 0.3s", whiteSpace: "pre-line" }}>{tool.title}</h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(250,247,242,0.45)", margin: "0 0 40px", fontFamily: "sans-serif", fontWeight: 300 }}>{tool.desc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 1, background: hovered === tool.id ? tool.accent : "rgba(250,247,242,0.2)", transition: "all 0.3s" }} />
                <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: hovered === tool.id ? tool.accent : "rgba(250,247,242,0.3)", fontFamily: "sans-serif", transition: "color 0.3s" }}>Open</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 2, padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid rgba(250,247,242,0.06)`, marginTop: 48 }}>
          <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.2)", fontFamily: "sans-serif" }}>© 2026 IMAGE-TOOLZ</span>
          <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.2)", fontFamily: "sans-serif" }}>Browser Based · No Upload</span>
        </div>
      </div>
    );
  }

  // ─── RESIZER ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#FAF7F2", fontFamily: "sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4 }} />

      {previewImg && <CropPreview img={previewImg} width={parseInt(width) || 800} height={parseInt(height) || 600} onClose={() => setPreviewImg(null)} onConfirm={(cropData) => saveCrop(previewImg.id, cropData)} />}

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

      <header style={{ position: "relative", zIndex: 2, padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, background: BG }}>
        <button onClick={() => setView("home")} style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-1px", color: "#FAF7F2", background: "none", border: "none", cursor: "pointer" }}>IMAGE-TOOLZ</button>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/editor" style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.4)", textDecoration: "none" }}>Editor</a>
          <a href="/converter" style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.4)", textDecoration: "none" }}>Converter</a>
          {user && <a href="/history" style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.4)", textDecoration: "none" }}>Geschiedenis</a>}
          {!user && <span style={{ fontSize: 11, letterSpacing: 2, color: "rgba(250,247,242,0.3)" }}>{remaining} download{remaining !== 1 ? "s" : ""} over</span>}
          {user ? (
            <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} style={{ padding: "8px 20px", border: `1px solid rgba(250,247,242,0.15)`, background: "transparent", color: "rgba(250,247,242,0.5)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>Uitloggen</button>
          ) : (
            <button onClick={() => window.location.href = "/login"} style={{ padding: "8px 20px", border: `1px solid rgba(250,247,242,0.15)`, background: "transparent", color: "rgba(250,247,242,0.5)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>Inloggen</button>
          )}
        </div>
      </header>

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "48px 48px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgba(250,247,242,0.3)", margin: "0 0 12px" }}>Tool — 01</p>
            <h1 style={{ fontSize: 48, fontWeight: 400, letterSpacing: "-2px", margin: 0, color: "#FAF7F2", fontFamily: "'Times New Roman', Georgia, serif" }}>Image Resizer</h1>
          </div>

          <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()}
            style={{ padding: "64px 40px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", border: dragging ? "1px solid rgba(250,247,242,0.6)" : `1px solid rgba(250,247,242,0.12)`, background: dragging ? "rgba(250,247,242,0.04)" : "transparent", borderRadius: 4 }}>
            <div style={{ fontSize: 36, marginBottom: 16, color: "rgba(250,247,242,0.3)" }}>+</div>
            <p style={{ fontSize: 14, color: "rgba(250,247,242,0.6)", margin: "0 0 6px" }}>Sleep afbeeldingen hierheen</p>
            <p style={{ fontSize: 11, color: "rgba(250,247,242,0.25)", margin: 0, letterSpacing: 2, textTransform: "uppercase" }}>of klik om te bladeren</p>
            <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
          </div>

          {images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {images.map((img) => (
                <div key={img.id} className="group" style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 4, background: BG2 }}>
                  <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {img.cropData && <div style={{ position: "absolute", top: 8, left: 8, background: "#FAF7F2", color: BG, fontSize: 9, padding: "2px 8px", letterSpacing: 2, textTransform: "uppercase" }}>Crop</div>}
                  <div className="opacity-0 group-hover:opacity-100" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s" }}>
                    <button onClick={() => setPreviewImg(img)} style={{ fontSize: 11, padding: "6px 12px", background: "#FAF7F2", color: BG, border: "none", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>Crop</button>
                    <button onClick={() => removeImage(img.id)} style={{ fontSize: 11, padding: "6px 12px", background: "rgba(250,247,242,0.15)", color: "#FAF7F2", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 8px", background: "rgba(0,0,0,0.6)" }}>
                    <p style={{ fontSize: 10, color: "rgba(250,247,242,0.6)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, background: BG2 }}>
            <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Instellingen</span>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24, background: BG }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ label: "Breedte", val: width, set: setWidth }, { label: "Hoogte", val: height, set: setHeight }].map((f) => (
                <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>{f.label}</label>
                  <input type="text" inputMode="numeric" value={f.val} onChange={(e) => f.set(e.target.value.replace(/[^0-9]/g, ""))}
                    style={{ background: BG2, border: `1px solid rgba(250,247,242,0.1)`, color: "#FAF7F2", padding: "10px 12px", fontSize: 14, outline: "none", borderRadius: 2 }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Modus</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {cropOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setCropMode(opt.value)}
                    style={{ textAlign: "left", padding: "10px 14px", cursor: "pointer", transition: "all 0.15s", background: cropMode === opt.value ? "rgba(250,247,242,0.08)" : "transparent", border: cropMode === opt.value ? `1px solid rgba(250,247,242,0.25)` : `1px solid rgba(250,247,242,0.06)`, color: cropMode === opt.value ? "#FAF7F2" : "rgba(250,247,242,0.4)", borderRadius: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(250,247,242,0.3)", marginTop: 2 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Formaat</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}
                style={{ background: BG2, border: `1px solid rgba(250,247,242,0.1)`, color: "#FAF7F2", padding: "10px 12px", fontSize: 13, outline: "none", borderRadius: 2 }}>
                <option value="jpeg" style={{ background: BG2 }}>JPEG</option>
                <option value="webp" style={{ background: BG2 }}>WebP</option>
                <option value="png" style={{ background: BG2 }}>PNG</option>
              </select>
            </div>
            {format !== "png" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.3)" }}>Kwaliteit</label>
                  <span style={{ fontSize: 11, color: "rgba(250,247,242,0.4)" }}>{quality}%</span>
                </div>
                <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} style={{ accentColor: "#FAF7F2", width: "100%" }} />
              </div>
            )}
            {!user && (
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, background: i < downloadCount ? "rgba(250,247,242,0.15)" : "#FAF7F2", borderRadius: 2, transition: "all 0.3s" }} />
                ))}
              </div>
            )}
            <button onClick={processAndDownload} disabled={images.length === 0 || processing}
              style={{ width: "100%", padding: "14px", background: images.length === 0 || (!user && downloadCount >= FREE_LIMIT) ? "rgba(250,247,242,0.06)" : "#FAF7F2", color: images.length === 0 || (!user && downloadCount >= FREE_LIMIT) ? "rgba(250,247,242,0.2)" : BG, border: "none", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", cursor: images.length === 0 ? "not-allowed" : "pointer", transition: "all 0.2s", borderRadius: 2 }}>
              {processing ? "Verwerken..." : !user && downloadCount >= FREE_LIMIT ? "Inloggen vereist" : images.length === 0 ? "Voeg foto's toe" : `Download ${images.length} foto${images.length > 1 ? "'s" : ""}`}
            </button>
            {images.length > 0 && (
              <button onClick={() => setImages([])} style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,247,242,0.2)", background: "none", border: "none", cursor: "pointer" }}>Alles verwijderen</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}