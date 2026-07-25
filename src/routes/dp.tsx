import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { toast } from "sonner";

import { trackDpGenerated } from "@/lib/dp.functions";
import dpFrame from "@/assets/dp-frame-v2.png.asset.json";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/dp")({
  head: () => ({
    meta: [
      {
        title:
          "Create Your Personalized DP · Men's Conference 2026 · CE Karu 1",
      },
      {
        name: "description",
        content:
          "Generate Your Personalized Men's Conference 2026 DP — The Kingdom Minded Man. Upload, Adjust, Download.",
      },
      {
        property: "og:title",
        content: "Create Your Personalized DP · Men's Conference 2026",
      },
      {
        property: "og:description",
        content: "Personalize Your DP for The Kingdom Minded Man conference.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DpPage,
});

// Position of the empty circular photo area inside the DP frame image
// (percentage of the frame's width/height). Measured against the uploaded
// personalized DP poster.
const CIRCLE = {
  centerX: 0.332,
  centerY: 0.408,
  radius: 0.226,
};

const OUTPUT_SIZE = 1080;

function DpPage() {
  const navigate = useNavigate();
  const track = useServerFn(trackDpGenerated);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [generating, setGenerating] = useState(false);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setFinalUrl(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function generate() {
    if (!imageSrc) {
      toast.error("Please upload a photo first.");
      return;
    }
    setGenerating(true);
    try {
      console.log("[DP] FileReader result length:", imageSrc.length);
      const [userImg, frameImg] = await Promise.all([
        loadImage(imageSrc),
        loadImage(dpFrame.url),
      ]);
      console.log("[DP] user image", userImg.naturalWidth, "x", userImg.naturalHeight);
      console.log("[DP] frame image", frameImg.naturalWidth, "x", frameImg.naturalHeight);

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      console.log("[DP] canvas", canvas.width, "x", canvas.height);

      // Layer 1 — cream background.
      ctx.fillStyle = "#F7F4EE";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const cx = CIRCLE.centerX * OUTPUT_SIZE;
      const cy = CIRCLE.centerY * OUTPUT_SIZE;
      const r = CIRCLE.radius * OUTPUT_SIZE;

      // Layer 2 + 3 — clip to circle, then draw user photo (cover fit).
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (croppedAreaPixels) {
        // Use the crop from react-easy-crop (respects drag + zoom).
        ctx.drawImage(
          userImg,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          cx - r,
          cy - r,
          r * 2,
          r * 2,
        );
      } else {
        // Fallback cover fit if crop pixels aren't ready yet.
        const iw = userImg.naturalWidth;
        const ih = userImg.naturalHeight;
        const side = Math.min(iw, ih);
        const sx = (iw - side) / 2;
        const sy = (ih - side) / 2;
        ctx.drawImage(userImg, sx, sy, side, side, cx - r, cy - r, r * 2, r * 2);
      }
      ctx.restore();
      console.log("[DP] drew user photo inside circle");

      // Layer 7 — frame on top (transparent circular center in v2 asset).
      ctx.drawImage(frameImg, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      console.log("[DP] drew frame overlay");

      const url = canvas.toDataURL("image/png");
      setFinalUrl(url);
      try {
        let attendee: { fullname?: string; phone?: string } = {};
        try {
          const raw = sessionStorage.getItem("mc2026:attendee");
          if (raw) attendee = JSON.parse(raw);
        } catch {
          // ignore
        }
        await track({
          data: {
            fullname: attendee.fullname ?? "",
            phone: attendee.phone ?? "",
          },
        });
      } catch {
        // analytics best-effort
      }
      toast.success("Your Personalized DP is Done!");
    } catch (err) {
      console.error("[DP] generation failed", err);
      toast.error("Could not generate DP. Please use a different image.");
    } finally {
      setGenerating(false);
    }
  }

  function download() {
    if (!finalUrl) return;
    const a = document.createElement("a");
    a.href = finalUrl;
    a.download = "mens-conference-2026-dp.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function reset() {
    setImageSrc(null);
    setFinalUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="border-b border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl gold-text">
            Men's Conference 2026
          </Link>
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.25em] text-gold hover:opacity-80"
          >
            ← Home
          </Link>
        </div>
      </header>

      <section
        className="px-6 py-14 sm:py-20"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="ornament">Personalized DP</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">
              Create Your Personalized DP
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Upload photo, adjust it inside the frame, then download in high
              resolution — perfect for WhatsApp, Facebook, Instagram, X, and Telegram.
            </p>
            <span className="gold-divider mx-auto mt-6 w-40" />
          </div>

          {finalUrl ? (
            <ThankYou
              finalUrl={finalUrl}
              onDownload={download}
              onAnother={reset}
              onHome={() => navigate({ to: "/" })}
            />
          ) : (
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {/* Editor */}
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-luxe">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Upload Photo (JPG · PNG · WEBP)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground hover:file:brightness-110"
                />

                {imageSrc ? (
                  <>
                    <div className="relative mt-5 aspect-square w-full overflow-hidden rounded-xl border border-gold bg-black">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                    <div className="mt-4">
                      <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                        Zoom
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={4}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-[color:var(--color-gold-deep)]"
                      />
                    </div>
                    <button
                      onClick={generate}
                      disabled={generating}
                      className="btn-gold mt-6 w-full rounded-xl px-6 py-3.5 text-sm"
                    >
                      {generating ? "Generating…" : "Generate Personalized DP"}
                    </button>
                  </>
                ) : (
                  <div className="mt-5 flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-gold/60 bg-background/50 text-center">
                    <p className="px-6 text-sm text-muted-foreground">
                      Choose a photo to begin.<br />
                      Drag, zoom, and reposition inside the circular frame.
                    </p>
                  </div>
                )}
              </div>

              {/* Preview frame */}
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-luxe">
                <p className="mb-3 text-center text-xs uppercase tracking-[0.25em] text-gold-deep">
                  DP Frame Preview
                </p>
                <img
                  src={dpFrame.url}
                  alt="Personalized DP frame"
                  className="w-full rounded-xl"
                  loading="eager"
                />
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Your photo will appear inside the circular gold frame.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ThankYou({
  finalUrl,
  onDownload,
  onAnother,
  onHome,
}: {
  finalUrl: string;
  onDownload: () => void;
  onAnother: () => void;
  onHome: () => void;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-gold bg-card p-6 shadow-luxe sm:p-10">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <img
          src={finalUrl}
          alt="Your personalized DP"
          className="w-full rounded-xl border border-gold"
        />
        <div className="text-center md:text-left">
          <span className="ornament">Thank You</span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            Thank You For Supporting Men's Conference 2026
          </h2>
          <p className="mt-2 font-display text-xl gold-text">
            The Kingdom Minded Man
          </p>
          <p className="mt-1 text-sm text-muted-foreground">31 Jul – 2 Aug 2026</p>
          <p className="mt-4 text-sm text-foreground/80">
            Please Share Your Personalized DP and Invite Others to attend.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <button
              onClick={onDownload}
              className="btn-gold rounded-xl px-6 py-3 text-sm"
            >
              Download DP
            </button>
            <button
              onClick={onAnother}
              className="btn-outline-gold rounded-xl px-6 py-3 text-sm"
            >
              Create Another DP
            </button>
            <button onClick={onHome} className="btn-dark rounded-xl px-6 py-3 text-sm">
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
