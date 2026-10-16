import { useEffect, useRef, useState } from "react";
import { sizedImage, srcSetFor } from "@/lib/imageUrl";

interface LazyImageProps {
  /** Candidate photos, best first. If one keeps failing the next is tried. */
  srcs: (string | undefined | null)[];
  alt: string;
  /** Tailwind aspect-ratio class for the reserved box. */
  ratio?: string;
  /** Width (px) of the main src; the srcset still offers 400w and 1200w. */
  width?: number;
  sizes?: string;
  /** Above-the-fold image: loads immediately at high priority. */
  priority?: boolean;
  className?: string;
  /** Called when every candidate failed (e.g. so a card can hide itself). */
  onAllFailed?: () => void;
}

const RETRY_DELAYS_MS = [400, 1200]; // retry the same URL twice before moving on

// An image that
//  - reserves its space up front (fixed aspect-ratio box), so nothing shifts;
//  - shows a shimmer until it has loaded, then fades in;
//  - only starts loading ~200px before it scrolls into view (unless priority);
//  - on error retries the same URL twice, then tries the next photo, and if
//    all of them fail renders nothing (no broken-image icon).
export const LazyImage = ({
  srcs,
  alt,
  ratio = "aspect-square",
  width = 400,
  sizes,
  priority = false,
  className = "",
  onAllFailed,
}: LazyImageProps) => {
  const candidates = srcs.filter((s): s is string => Boolean(s));
  const boxRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(priority);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // Start loading when within 200px of the viewport.
  useEffect(() => {
    if (priority || inView) return;
    const el = boxRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, inView]);

  // New photo list -> start over.
  const key = candidates.join("|");
  useEffect(() => {
    setIndex(0);
    setAttempt(0);
    setLoaded(false);
    setFailed(false);
  }, [key]);

  useEffect(() => {
    if (failed) onAllFailed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  if (failed || candidates.length === 0) return null;

  const current = candidates[Math.min(index, candidates.length - 1)];
  const baseSrc = sizedImage(current, width);
  // ?r=<n> only busts the browser's failed-response cache on a retry.
  const src = attempt > 0 ? `${baseSrc}${baseSrc.includes("?") ? "&" : "?"}r=${attempt}` : baseSrc;

  const handleError = () => {
    if (attempt < RETRY_DELAYS_MS.length) {
      const delay = RETRY_DELAYS_MS[attempt];
      setTimeout(() => setAttempt((n) => n + 1), delay);
      return;
    }
    if (index + 1 < candidates.length) {
      setIndex((i) => i + 1);
      setAttempt(0);
      return;
    }
    setFailed(true);
  };

  return (
    <div ref={boxRef} className={`relative overflow-hidden bg-muted ${ratio} ${className}`}>
      {/* Shimmer until the photo has loaded */}
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted"
        />
      )}
      {inView && (
        <img
          key={`${index}`}
          src={src}
          srcSet={attempt === 0 ? srcSetFor(current) : undefined}
          sizes={sizes}
          alt={alt}
          loading="eager"
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
};
