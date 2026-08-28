import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // This is a client-rendered SPA served from static hosting, so an unknown
  // route still comes back as an HTTP 200 (Cloudflare Pages' SPA fallback) —
  // there's no way to send a real 404 status from here. noindex is Google's
  // documented mitigation for that: it stops this "soft 404" from ever being
  // indexed, and clears out whatever title/description/canonical the
  // previous page left behind (this SPA reuses one document across routes).
  useSEO({ title: "Page Not Found", path: location.pathname, noindex: true });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
