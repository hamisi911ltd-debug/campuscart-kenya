import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareProductProps {
  id: string;
  title: string;
  price: number;
  description?: string;
  /** "full" = labelled WhatsApp button + copy; "icon" = compact buttons for cards. */
  variant?: "full" | "icon";
  className?: string;
}

const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5ZM12 22a9.9 9.9 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 1 1 12 22Zm5.4-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-1 1.2c-.2.2-.4.2-.7.1a8.1 8.1 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z" />
  </svg>
);

const shortDescription = (text?: string) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > 110 ? clean.slice(0, 109).trimEnd() + "…" : clean;
};

// Shares a product on WhatsApp. The message carries the title, price, a short
// description and the product link; the link is /share/<id>, a server-rendered
// page with Open Graph tags (functions/share/[id].ts), so WhatsApp unfurls it
// with the product photo, title and description underneath the message.
export const ShareProduct = ({ id, title, price, description, variant = "full", className = "" }: ShareProductProps) => {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/share/${id}`;

  const message = [
    `🔥 *${title}*`,
    `💰 KES ${price.toLocaleString("en-KE")}`,
    shortDescription(description),
    "",
    `👉 ${link}`,
  ].filter((line, i) => i !== 2 || line).join("\n");

  const shareOnWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
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
          <WhatsAppIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Share</span>
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
        <WhatsAppIcon /> Share on WhatsApp
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
