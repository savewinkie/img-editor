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
    const iw = el.clientWidth;
    const ih = el.clientHeight;
    setImgSize({ w: iw, h: ih });
    const scale = Math.min(iw / (el.naturalWidth || width), ih / (el.naturalHeight || height));
    const cw = Math.min(width * scale, iw);
    const ch = Math.min(height * scale, ih);
    setCrop({ x: (iw - cw) / 2, y: (ih - ch) / 2, w: cw, h: ch });
  };

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const startAction = (e: React.MouseEvent, type: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    action.current = type;
    dragStart.current = { mx: e.clientX, my: e.clientY, crop: { ...crop } };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!action.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const c = { ...dragStart.current.crop };
    const minSize = 30;
    if (action.current === "move") {
      setCrop({ ...c, x: clamp(c.x + dx, 0, imgSize.w - c.w), y: clamp(c.y + dy, 0, imgSize.h - c.h) });
    } else if (action.current === "se") {
      setCrop({ ...c, w: clamp(c.w + dx, minSize, imgSize.w - c.x), h: clamp(c.h + dy, minSize, imgSize.h - c.y) });
    } else if (action.current === "sw") {
      const newW = clamp(c.w - dx, minSize, c.x + c.w);
      setCrop({ ...c, x: c.x + c.w - newW, w: newW, h: clamp(c.h + dy, minSize, imgSize.h - c.y) });
    } else if (action.current === "ne") {
      const newH = clamp(c.h - dy, minSize, c.y + c.h);
      setCrop({ ...c, y: c.y + c.h - newH, w: clamp(c.w + dx, minSize, imgSize.w - c.x), h: newH });
    } else if (action.current === "nw") {
      const newW = clamp(c.w - dx, minSize, c.x + c.w);
      const newH = clamp(c.h - dy, minSize, c.y + c.h);
      setCrop({ x: c.x + c.w - newW, y: c.y + c.h - newH, w: newW, h: newH });
    }
  };

  const onMouseUp = () => { action.current = null; };

  const handleConfirm = () => {
    const el = imgRef.current!;
    const scaleX = el.naturalWidth / imgSize.w;
    const scaleY = el.naturalHeight / imgSize.h;
    onConfirm({ x: crop.x * scaleX, y: crop.y * scaleY, w: crop.w * scaleX, h: crop.h * scaleY });
  };

  const handles: { pos: "nw" | "ne" | "sw" | "se"; style: React.CSSProperties }[] = [
    { pos: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
    { pos: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
    { pos: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
    { pos: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(42,32,18,0.85)" }} onClick={onClose}>
      <div className="max-w-xl w-full p-6 rounded-2xl" style={{ background: "#FAF7F2", border: "1px solid #E8DFD0" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold tracking-tight text-lg" style={{ color: "#2A2016" }}>Crop</h3>
          <button onClick={onClose} className="hover:opacity-50 transition-opacity text-xl font-light" style={{ color: "#2A2016" }}>✕</button>
        </div>
        <div ref={containerRef} className="relative inline-block w-full select-none" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <img ref={imgRef} src={img.url} alt={img.name} onLoad={onLoad} draggable={false} className="w-full object-contain rounded-lg" style={{ maxHeight: 480 }} />
          {crop.w > 0 && (
            <>
              <div className="absolute pointer-events-none" style={{ top: 0, left: 0, right: 0, height: crop.y, background: "rgba(250,247,242,0.75)" }} />
              <div className="absolute pointer-events-none" style={{ top: crop.y + crop.h, left: 0, right: 0, bottom: 0, background: "rgba(250,247,242,0.75)" }} />
              <div className="absolute pointer-events-none" style={{ top: crop.y, left: 0, width: crop.x, height: crop.h, background: "rgba(250,247,242,0.75)" }} />
              <div className="absolute pointer-events-none" style={{ top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h, background: "rgba(250,247,242,0.75)" }} />
              <div onMouseDown={(e) => startAction(e, "move")} className="absolute cursor-move" style={{ top: crop.y, left: crop.x, width: crop.w, height: crop.h, border: "2px solid #8B6F47" }}>
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: "linear-gradient(rgba(139,111,71,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,111,71,0.15) 1px, transparent 1px)",
                  backgroundSize: `${crop.w / 3}px ${crop.h / 3}px`
                }} />
                {handles.map(({ pos, style }) => (
                  <div key={pos} onMouseDown={(e) => startAction(e, pos)} className="absolute w-3 h-3 z-10" style={{ ...style, position: "absolute", background: "#8B6F47" }} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="mt-4 text-xs text-center tracking-widest uppercase" style={{ color: "#B8A690" }}>
          {Math.round(crop.w)} × {Math.round(crop.h)} — output {width} × {height}px
        </div>
        <button onClick={handleConfirm} className="mt-4 w-full text-white text-sm font-medium py-3 tracking-widest uppercase transition-all rounded-full hover:opacity-90" style={{ background: "#8B6F47" }}>
          Bevestigen
        </button>
      </div>
    </div>
  );
}

export default function Home() {
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
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
      .map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
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
    canvas.width = targetW;
    canvas.height = targetH;
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    if (cropData) {
      ctx.drawImage(img, cropData.x, cropData.y, cropData.w, cropData.h, 0, 0, targetW, targetH);
    } else if (cropMode === "stretch") {
      ctx.drawImage(img, 0, 0, targetW, targetH);
    } else if (cropMode === "fit") {
      const scale = Math.min(targetW / srcW, targetH / srcH);
      const newW = srcW * scale;
      const newH = srcH * scale;
      ctx.fillStyle = "#FAF7F2";
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, (targetW - newW) / 2, (targetH - newH) / 2, newW, newH);
    } else if (cropMode === "fill") {
      const scale = Math.max(targetW / srcW, targetH / srcH);
      const newW = srcW * scale;
      const newH = srcH * scale;
      ctx.drawImage(img, (targetW - newW) / 2, (targetH - newH) / 2, newW, newH);
    } else {
      ctx.drawImage(img, 0, 0);
    }
    return canvas;
  };

  const saveToHistory = async (filename: string, file: File) => {
    if (!user) return;
    const filePath = `${user.id}/${Date.now()}_${filename}`;
    const { data: uploadData } = await supabase.storage
      .from("images")
      .upload(filePath, file, { upsert: true });
    const imageUrl = uploadData?.path
      ? supabase.storage.from("images").getPublicUrl(uploadData.path).data.publicUrl
      : null;
    await supabase.from("history").insert({
      user_id: user.id,
      filename,
      width: parseInt(width),
      height: parseInt(height),
      format,
      crop_mode: cropMode,
      image_url: imageUrl,
    });
  };

  const processAndDownload = async () => {
    if (images.length === 0) return;
    setProcessing(true);
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
      a.href = dataUrl;
      a.download = imgFile.name.replace(/\.[^.]+$/, "") + "." + format;
      a.click();
      await saveToHistory(imgFile.name, imgFile.file);
      await new Promise((res) => setTimeout(res, 200));
    }
    setProcessing(false);
  };

  const cropOptions: { value: CropMode; label: string; desc: string }[] = [
    { value: "fill", label: "Fill", desc: "Vult volledig, snijdt randen weg" },
    { value: "fit", label: "Fit", desc: "Hele foto zichtbaar, crème randen" },
    { value: "stretch", label: "Stretch", desc: "Uitrekken naar exacte maat" },
    { value: "none", label: "Origineel", desc: "Originele afmetingen behouden" },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FAF7F2", color: "#2A2016" }}>
      {previewImg && (
        <CropPreview
          img={previewImg}
          width={parseInt(width) || 800}
          height={parseInt(height) || 600}
          onClose={() => setPreviewImg(null)}
          onConfirm={(cropData) => saveCrop(previewImg.id, cropData)}
        />
      )}

      <header className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #E8DFD0" }}>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold tracking-tighter" style={{ color: "#2A2016" }}>BRONS-CO</div>
          <div className="hidden sm:block w-px h-5" style={{ background: "#E8DFD0" }} />
          <div className="hidden sm:block text-sm tracking-wide" style={{ color: "#B8A690" }}>Image Resizer</div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <a href="/history" className="text-sm hover:opacity-60 transition-opacity" style={{ color: "#8B6F47" }}>
              Geschiedenis
            </a>
          )}
          {images.length > 0 && (
            <div className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>
              {images.length} afbeelding{images.length > 1 ? "en" : ""}
            </div>
          )}
          {user ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              className="px-6 py-2 rounded-full text-sm font-medium transition-all"
              style={{ border: "1px solid #8B6F47", color: "#8B6F47" }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#8B6F47"; (e.target as HTMLButtonElement).style.color = "white"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "transparent"; (e.target as HTMLButtonElement).style.color = "#8B6F47"; }}>
              Uitloggen
            </button>
          ) : (
            <button
              onClick={() => window.location.href = "/login"}
              className="px-6 py-2 rounded-full text-sm font-medium transition-all"
              style={{ border: "1px solid #8B6F47", color: "#8B6F47" }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#8B6F47"; (e.target as HTMLButtonElement).style.color = "white"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "transparent"; (e.target as HTMLButtonElement).style.color = "#8B6F47"; }}>
              Inloggen
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="p-16 text-center cursor-pointer transition-all rounded-2xl"
            style={{ border: dragging ? "2px dashed #8B6F47" : "2px dashed #D4C4B0", background: dragging ? "#F5EFE6" : "transparent" }}
          >
            <div className="text-5xl mb-4">+</div>
            <p className="text-base font-medium tracking-tight" style={{ color: "#2A2016" }}>Sleep afbeeldingen hierheen</p>
            <p className="text-sm mt-1" style={{ color: "#B8A690" }}>of klik om te bladeren</p>
            <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group aspect-square overflow-hidden rounded-xl" style={{ background: "#F0EAE0" }}>
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  {img.cropData && (
                    <div className="absolute top-2 left-2 text-white text-xs px-2 py-0.5 tracking-widest uppercase rounded-full" style={{ background: "#8B6F47" }}>
                      Crop
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" style={{ background: "rgba(42,32,18,0.6)" }}>
                    <button onClick={() => setPreviewImg(img)} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "#FAF7F2", color: "#2A2016" }}>Crop</button>
                    <button onClick={() => removeImage(img.id)} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "#FAF7F2", color: "#2A2016" }}>✕</button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ background: "rgba(250,247,242,0.9)" }}>
                    <p className="text-xs truncate" style={{ color: "#8B6F47" }}>{img.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-6 flex flex-col gap-6 rounded-2xl" style={{ border: "1px solid #E8DFD0", background: "#FDF9F4" }}>
            <div className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Instellingen</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Breedte</label>
                <input type="text" inputMode="numeric" value={width}
                  onChange={(e) => setWidth(e.target.value.replace(/[^0-9]/g, ""))}
                  className="px-3 py-2 text-sm outline-none rounded-lg"
                  style={{ border: "1px solid #E8DFD0", background: "#FAF7F2", color: "#2A2016" }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Hoogte</label>
                <input type="text" inputMode="numeric" value={height}
                  onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ""))}
                  className="px-3 py-2 text-sm outline-none rounded-lg"
                  style={{ border: "1px solid #E8DFD0", background: "#FAF7F2", color: "#2A2016" }} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Modus</label>
              <div className="flex flex-col gap-1">
                {cropOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setCropMode(opt.value)}
                    className="text-left px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      border: cropMode === opt.value ? "1px solid #8B6F47" : "1px solid #E8DFD0",
                      background: cropMode === opt.value ? "#8B6F47" : "transparent",
                      color: cropMode === opt.value ? "white" : "#2A2016"
                    }}>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: cropMode === opt.value ? "#F0D9C0" : "#B8A690" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Formaat</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}
                className="px-3 py-2 text-sm outline-none rounded-lg"
                style={{ border: "1px solid #E8DFD0", background: "#FAF7F2", color: "#2A2016" }}>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
                <option value="png">PNG</option>
              </select>
            </div>

            {format !== "png" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs tracking-widest uppercase" style={{ color: "#B8A690" }}>Kwaliteit — {quality}%</label>
                <input type="range" min="10" max="100" value={quality}
                  onChange={(e) => setQuality(e.target.value)} className="accent-amber-700" />
              </div>
            )}

            <button onClick={processAndDownload} disabled={images.length === 0 || processing}
              className="w-full text-white text-sm font-medium py-3 tracking-widest uppercase transition-all rounded-full hover:opacity-90 disabled:opacity-30"
              style={{ background: "#8B6F47" }}>
              {processing ? "Verwerken..." : images.length === 0 ? "Voeg foto's toe" : `Download ${images.length} foto${images.length > 1 ? "'s" : ""}`}
            </button>

            {images.length > 0 && (
              <button onClick={() => setImages([])} className="text-xs text-center tracking-widest uppercase transition-colors hover:opacity-60" style={{ color: "#B8A690" }}>
                Alles verwijderen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}