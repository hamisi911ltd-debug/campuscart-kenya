import { useState } from "react";
import { Check, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sizedImage } from "@/lib/imageUrl";
import { shortProductTitle } from "@/lib/productTitle";

interface ShareProductProps {
  id: string;
  title: string;
  price: number;
  /** The product photo to put on the share card. */
  image?: string;
  /** "full" = labelled WhatsApp button + copy; "icon" = compact buttons for cards. */
  variant?: "full" | "icon";
  className?: string;
}

const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5ZM12 22a9.9 9.9 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 1 1 12 22Zm5.4-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-1 1.2c-.2.2-.4.2-.7.1a8.1 8.1 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z" />
  </svg>
);

// ---------------------------------------------------------------------------
// The share card: a large portrait picture that works as a WhatsApp status or
// chat image. The photo takes about three quarters of it; underneath, in a
// classic ivory footer, sit the name and the price.
const CARD_W = 1080;
const CARD_H = 1350;
const PHOTO_H = 1010; // ~75% of the card is the photo
const SERIF = `Georgia, "Times New Roman", serif`;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed"));
    img.src = url;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s,.;:-]+$/, "") + "…";
    return kept;
  }
  return lines;
}

async function buildShareCard(image: string | undefined, name: string, price: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // ivory background
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // the photo, large, cropped to fill its area
  if (image) {
    try {
      const photo = await loadImage(sizedImage(image, 1200));
      const scale = Math.max(CARD_W / photo.naturalWidth, PHOTO_H / photo.naturalHeight);
      const w = photo.naturalWidth * scale;
      const h = photo.naturalHeight * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, CARD_W, PHOTO_H);
      ctx.clip();
      ctx.drawImage(photo, (CARD_W - w) / 2, (PHOTO_H - h) / 2, w, h);
      ctx.restore();
    } catch {
      return null; // no photo = nothing worth sharing as an image
    }
  }

  // thin gold rule between photo and footer
  ctx.fillStyle = "#b8923a";
  ctx.fillRect(0, PHOTO_H, CARD_W, 5);

  // name (classic serif, up to two lines) and price, centred as one block in the footer
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `bold 54px ${SERIF}`;
  const lines = wrapLines(ctx, name, CARD_W - 140, 2);
  const NAME_LINE = 62;
  const PRICE_SIZE = 84;
  const GAP = 34;
  const footerTop = PHOTO_H + 5;
  const footerBottom = CARD_H - 62; // leave room for the wordmark
  const blockH = lines.length * NAME_LINE + GAP + PRICE_SIZE;
  let y = footerTop + (footerBottom - footerTop - blockH) / 2 + 48;
  ctx.fillStyle = "#1b2a41";
  for (const line of lines) {
    ctx.fillText(line, CARD_W / 2, y);
    y += NAME_LINE;
  }
  ctx.fillStyle = "#2f6b1f";
  ctx.font = `bold ${PRICE_SIZE}px ${SERIF}`;
  ctx.fillText(`KES ${price.toLocaleString("en-KE")}`, CARD_W / 2, y - NAME_LINE + GAP + PRICE_SIZE);

  // small wordmark
  ctx.fillStyle = "#8a8272";
  ctx.font = `600 24px ${SERIF}`;
  ctx.fillText("C A M P U S M A R T   K E N Y A", CARD_W / 2, CARD_H - 30);

  // classic frame
  ctx.strokeStyle = "#1b2a41";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, CARD_W - 12, CARD_H - 12);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
}

// Shares a product. The message is short - the name, the price and the link -
// and, on phones, the large share card goes with it as a picture, so it posts
// to a WhatsApp status or chat as an image. (Where the browser can't share
// files, e.g. most desktops, the picture is saved and WhatsApp opens with the
// text, so it can be attached.) The /share/<id> link also carries the photo in
// its link preview.
export const ShareProduct = ({ id, title, price, image, variant = "full", className = "" }: ShareProductProps) => {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = shortProductTitle(title);
  const link = `${window.location.origin}/share/${id}`;
  const text = `${name}\nKES ${price.toLocaleString("en-KE")}\n${link}`;

  const openWhatsAppText = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");

  const shareOnWhatsApp = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const blob = image ? await buildShareCard(image, name, price) : null;
      if (blob) {
        const file = new File([blob], `${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 40) || "product"}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text });
          return;
        }
        // No file sharing (desktop): save the picture and open WhatsApp with the text.
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

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy - long-press the link to copy it");
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
        <button
          type="button"
          onClick={copyLink}
          title="Copy link"
          className="rounded-lg bg-secondary px-2.5 py-2 text-foreground transition-colors hover:bg-secondary/80"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
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
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
};
