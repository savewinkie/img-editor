"use client";
import { useState, useRef, useCallback } from "react";

export default function Upscaler() {
  const [image, setImage] = useState<{ url: string; name: string; file: File } | null>(null);
  const [scale, setScale] = useState("2");
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const addFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImage({ url: URL.createObjectURL(file), name: file.name, file });
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) addFile(file);
  }, []);

  const upscale = async () => {
    if (!image) return;
    setProcessing(true);

    const img = new Image();
    img.src = image.url;
    await new Promise((res) => (img.onload = res));

    setOriginalSize({ w: img.naturalWidth, h: img.naturalHeight });

    const factor = parseInt(scale);
    const newW = img.naturalWidth * factor;
    const newH = img.naturalHeight * factor;

    // Stap voor stap upscalen voor betere kwaliteit
    let currentCanvas = document.createElement("canvas");
    currentCanvas.width = img.naturalWidth;
    currentCanvas.height = img.naturalHeight;
    let ctx = currentCanvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    // Verdubbel stap voor stap
    let steps = Math.log2(factor);
    for (let i = 0; i < steps; i++) {
      const nextCanvas = document.createElement("canvas");
      nextCanvas.width = currentCanvas.width * 2;
      nextCanvas.height = currentCanvas.height * 2;
      const nextCtx = nextCanvas.getContext("2d")!;
      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = "high";
      nextCtx.drawImage(currentCanvas, 0, 0, nextCanvas.width, nextCanvas.height);
      currentCanvas = nextCanvas;
    }

    // Als factor geen macht van 2 is (bijv. 3x)
    if (currentCanvas.width !== newW || currentCanvas.height !== newH) {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = newW;
      finalCanvas.height = newH;
      const finalCtx = finalCanvas.getContext("2d")!;
      finalCtx.imageSmoothingEnabled = true;
      finalCtx.imageSmoothingQuality = "high";
      finalCtx.drawImage(currentCanvas, 0, 0, newW, newH);
      currentCanvas = finalCanvas;
    }

    setResult(currentCanvas.toDataURL("image/png"));
    setProcessing(false);
  };

  const download = () => {
    if (!result || !image) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = image.name.replace(/\.[^.]+$/, "") + `_${scale}x.png`;
    a.click();
  };

  const newSize = image && originalSize.w > 0 ? {
    w: originalSize.w * parseInt(scale),
    h: originalSize.h * parseInt(scale)
  } : null;

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FAF7F2" }}>
      <header className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A1A1A" }}>
        <a href="/" className="text-2xl font-bold tracking-tighter" style={{ color: "#1A1A1A" }}>image-toolz</a>
        <a href="/" className="text-sm font-medium px-5 py-2 rounded-full transition-all hover:bg-black hover:text-white"
          style={{ border: "1px solid #1A1A1A", color: "#1A1A1A" }}>
          ← Terug
        </a>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tighter mb-2" style={{ color: "#1A1A1A" }}>Upscaler</h1>
          <p style={{ color: "#8B8B8B" }}>Vergroot je afbeelding met behoud van kwaliteit</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload + preview */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!image ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer transition-all"
                style={{
                  border: dragging ? "2px dashed #1A1A1A" : "2px dashed #C8C0B0",
                  borderRadius: "24px",
                  padding: "80px 40px",
                  textAlign: "center",
                  background: dragging ? "#F0EAE0" : "transparent"
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>↑</div>
                <p className="text-lg font-medium" style={{ color: "#1A1A1A" }}>Sleep een afbeelding hierheen</p>
                <p className="text-sm mt-2" style={{ color: "#8B8B8B" }}>of klik om te bladeren · PNG, JPG, WebP</p>
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs tracking-widest uppercase font-medium" style={{ color: "#8B8B8B" }}>Origineel</p>
                      {originalSize.w > 0 && (
                        <p className="text-xs" style={{ color: "#8B8B8B" }}>{originalSize.w} × {originalSize.h}px</p>
                      )}
                    </div>
                    <div className="rounded-2xl overflow-hidden" style={{ background: "#EDE8E0", aspectRatio: "4/3" }}>
                      <img src={image.url} alt="origineel" className="w-full h-full object-contain"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          setOriginalSize({ w: img.naturalWidth, h: img.naturalHeight });
                        }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs tracking-widest uppercase font-medium" style={{ color: "#8B8B8B" }}>
                        {result ? `Upscaled ${scale}×` : "Preview"}
                      </p>
                      {result && newSize && (
                        <p className="text-xs" style={{ color: "#8B8B8B" }}>{newSize.w} × {newSize.h}px</p>
                      )}
                    </div>
                    <div className="rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{ background: "#EDE8E0", aspectRatio: "4/3" }}>
                      {result ? (
                        <img src={result} alt="upscaled" className="w-full h-full object-contain" />
                      ) : (
                        <p className="text-sm" style={{ color: "#B0A898" }}>Klik op Upscale</p>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={() => { setImage(null); setResult(null); setOriginalSize({ w: 0, h: 0 }); }}
                  className="text-xs tracking-widest uppercase self-start hover:opacity-60 transition-opacity"
                  style={{ color: "#8B8B8B" }}>
                  ← Andere afbeelding
                </button>
              </div>
            )}
          </div>

          {/* Instellingen */}
          <div className="flex flex-col gap-4">
            <div className="p-6 flex flex-col gap-6 rounded-2xl"
              style={{ border: "1px solid #1A1A1A", background: "#1A1A1A" }}>
              <div className="text-xs tracking-widest uppercase" style={{ color: "#8B8B8B" }}>Schaal</div>

              <div className="flex flex-col gap-2">
                {[
                  { value: "2", label: "2×", desc: "Aanbevolen" },
                  { value: "4", label: "4×", desc: "Hoge vergroting" },
                  { value: "8", label: "8×", desc: "Maximale vergroting" },
                ].map((s) => (
                  <button key={s.value} onClick={() => setScale(s.value)}
                    className="text-left px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: scale === s.value ? "#FAF7F2" : "transparent",
                      border: scale === s.value ? "1px solid #FAF7F2" : "1px solid #333",
                      color: scale === s.value ? "#1A1A1A" : "#FAF7F2"
                    }}>
                    <div className="text-sm font-medium">{s.label} groter</div>
                    <div className="text-xs mt-0.5" style={{ color: scale === s.value ? "#8B8B8B" : "#666" }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              {originalSize.w > 0 && (
                <div className="text-xs p-3 rounded-xl" style={{ background: "#2A2A2A", color: "#8B8B8B" }}>
                  {originalSize.w} × {originalSize.h}px
                  <br />
                  → {originalSize.w * parseInt(scale)} × {originalSize.h * parseInt(scale)}px
                </div>
              )}

              <button onClick={upscale} disabled={!image || processing}
                className="w-full font-medium py-3 rounded-full transition-all hover:opacity-90 disabled:opacity-30 tracking-widest uppercase text-sm"
                style={{ background: "#FAF7F2", color: "#1A1A1A" }}>
                {processing ? "Bezig..." : "Upscale"}
              </button>

              {result && (
                <button onClick={download}
                  className="w-full font-medium py-3 rounded-full transition-all hover:opacity-80 tracking-widest uppercase text-sm"
                  style={{ border: "1px solid #FAF7F2", color: "#FAF7F2" }}>
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}