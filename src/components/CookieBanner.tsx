import { useState } from "react";
import { Link } from "react-router-dom";

const KEY = "cm_cookie_notice";

/** One-time notice. CampusMart only uses essential storage (see /cookies), so this informs rather than asks. */
export const CookieBanner = () => {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem(KEY); } catch { return false; }
  });
  if (!open) return null;

  const accept = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* not essential */ }
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Cookie notice" className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-xl rounded-2xl bg-foreground p-4 text-background shadow-elevated md:bottom-4">
      <p className="text-sm">
        CampusMart uses only the cookies and storage it needs: your cart, sign-in and checkout details. No ads, no tracking.{" "}
        <Link to="/cookies" className="font-bold underline">Read our Cookie Policy</Link>
      </p>
      <button onClick={accept} className="mt-3 w-full rounded-full bg-background px-5 py-2 text-sm font-bold text-foreground hover:opacity-90">
        Got it
      </button>
    </div>
  );
};
