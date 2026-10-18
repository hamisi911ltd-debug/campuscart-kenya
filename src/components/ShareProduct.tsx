import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sizedImage } from "@/lib/imageUrl";
import { shortProductTitle } from "@/lib/productTitle";
import logoUrl from "@/assets/logo-badge.png";

interface ShareProductProps {
  id: string;
  title: string;
  price: number;
  /** The product photo to put on the share picture. */
  image?: string;
  /** Stored description - a few bullet points are taken from it for the message. */
  description?: string | null;
  /** "full" = labelled WhatsApp button; "icon" = compact button for cards. */
  variant?: "full" | "icon";
  className?: string;
}

const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5ZM12 22a9.9 9.9 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 1 1 12 22Zm5.4-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-1 1.2c-.2.2-.4.2-.7.1a8.1 8.1 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z" />
  </svg>
);

// ---------------------------------------------------------------------------
// The share picture: just the product photo, with a faded CampusMart logo as a
// watermark in the centre. No badges and no name/price strip - the details go
// in the message under the picture.
const CARD_W = 1080;
const CARD_H = 1350;
const SANS = `"Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const GREEN = "#7CB342";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed"));
    img.src = url;
  });
}

async function buildShareCard(image: string | undefined): Promise<Blob | null> {
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let photo: HTMLImageElement;
  try {
    photo = await loadImage(sizedImage(image, 1200));
  } catch {
    return null; // no photo = nothing worth sharing as an image
  }
  const logo = await loadImage(logoUrl).catch(() => null);

  // soft blurred backdrop from the same photo, so any shape of photo fills the card
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  {
    const scale = Math.max(CARD_W / photo.naturalWidth, CARD_H / photo.naturalHeight);
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    ctx.save();
    ctx.filter = "blur(40px)";
    ctx.globalAlpha = 0.55;
    ctx.drawImage(photo, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
    ctx.restore();
  }

  // the photo itself, as large as fits without cropping
  {
    const scale = Math.min(CARD_W / photo.naturalWidth, CARD_H / photo.naturalHeight);
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    ctx.drawImage(photo, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
  }

  // faded CampusMart watermark, centred
  const R = 150;
  const cx = CARD_W / 2;
  const cy = CARD_H / 2 - 40;
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `800 84px ${SANS}`;
  const w1 = ctx.measureText("CAMPUS").width;
  const w2 = ctx.measureText("MART").width;
  const x = cx - (w1 + w2) / 2;
  const y = cy + R + 100;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("CAMPUS", x, y);
  ctx.fillStyle = GREEN;
  ctx.fillText("MART", x + w1, y);
  ctx.restore();

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
}

/** A few short bullet points from the stored description (specifications first, else the opening sentences). */
export function descriptionBullets(description: string | null | undefined, max = 4): string[] {
  const text = (description || "").replace(/\r/g, "");
  if (!text.trim()) return [];
  const clip = (t: string) => {
    const clean = t.replace(/\s+/g, " ").trim();
    if (clean.length <= 70) return clean;
    const cut = clean.slice(0, 70);
    return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[\s,.;:-]+$/, "") + "…";
  };
  const bullets = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[•\-*]\s*/.test(l))
    .map((l) => l.replace(/^[•\-*]\s*/, ""))
    .filter((l) => l.length >= 4);
  if (bullets.length) return bullets.slice(0, max).map(clip);
  const intro = text.split(/\n\s*\n/)[0] || text;
  return intro
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 12)
    .slice(0, max)
    .map(clip);
}

export function buildShareText(name: string, price: number, description: string | null | undefined, link: string): string {
  const bullets = descriptionBullets(description).map((b) => `• ${b}`);
  return [`*${name}*`, `KES ${price.toLocaleString("en-KE")}`, ...(bullets.length ? ["", ...bullets] : []), "", `View & order: ${link}`].join("\n");
}

// Shares a product: on phones the clean photo goes with the message as a picture, so it posts to a
// WhatsApp status or chat; where the browser cannot share files (most desktops) the picture is saved
// and WhatsApp opens with the text. The /share/<id> link also carries the photo in its preview.
export const ShareProduct = ({ id, title, price, image, description, variant = "full", className = "" }: ShareProductProps) => {
  const [busy, setBusy] = useState(false);
  const name = shortProductTitle(title);
  const link = `${window.location.origin}/share/${id}`;
  const text = buildShareText(name, price, description, link);

  const openWhatsAppText = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");

  const shareOnWhatsApp = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const blob = await buildShareCard(image);
      if (blob) {
        const file = new File([blob], `${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 40) || "product"}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text });
          return;
        }
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        toast.success("Picture saved - attach it in WhatsApp");
      }
      openWhatsAppText();
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return; // closed the share sheet
      openWhatsAppText();
    } finally {
      setBusy(false);
    }
  };

  if (variant === "icon") {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          type="button"
          onClick={shareOnWhatsApp}
          title="Share on WhatsApp"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WhatsAppIcon className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={shareOnWhatsApp}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WhatsAppIcon />} Share on WhatsApp
      </button>
    </div>
  );
};
