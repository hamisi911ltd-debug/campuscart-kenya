import { useEffect } from "react";

const SITE_URL = "https://campusmart.co.ke";
const SITE_NAME = "CampusMart Kenya";
const DEFAULT_DESCRIPTION =
  "CampusMart Kenya - Wholesale Prices, Real Savings. Shop phones, electronics, fashion, appliances, home & kitchen and more at wholesale prices, with fast delivery and secure M-Pesa payments across Kenya.";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

interface SEOOptions {
  /** Page-specific title, e.g. "Electronics". The site name is appended automatically. */
  title: string;
  description?: string;
  /** Path only, e.g. "/category/electronics". Defaults to the current location. */
  path?: string;
  image?: string;
  /** Arbitrary JSON-LD objects to inject for this page (e.g. BreadcrumbList, Product). */
  structuredData?: Record<string, unknown>[];
  /** Sign-in-gated or otherwise thin/duplicate pages that shouldn't be indexed. */
  noindex?: boolean;
}

function setMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const STRUCTURED_DATA_ID = "route-structured-data";

function setStructuredData(objects: Record<string, unknown>[] | undefined) {
  const existing = document.getElementById(STRUCTURED_DATA_ID);
  if (existing) existing.remove();
  if (!objects || objects.length === 0) return;

  const script = document.createElement("script");
  script.id = STRUCTURED_DATA_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(objects.length === 1 ? objects[0] : objects);
  document.head.appendChild(script);
}

/**
 * Keeps <title>, meta description, canonical, Open Graph/Twitter tags and
 * page-level JSON-LD in sync with the current route. This is a client-side-rendered
 * SPA, so this only affects crawlers that execute JS (Googlebot does; WhatsApp/
 * Facebook/Twitter link-preview bots do not — those still see the static tags
 * baked into index.html).
 */
export function useSEO({ title, description = DEFAULT_DESCRIPTION, path, image = DEFAULT_IMAGE, structuredData, noindex = false }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Wholesale Prices, Real Savings`;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;

    document.title = fullTitle;
    setMetaByName("description", description);
    setCanonical(url);

    // The SPA reuses one document across client-side route changes, so this
    // must be reset on every navigation rather than only set when true —
    // otherwise a noindex page would "leak" into the next indexable page.
    setMetaByName(
      "robots",
      noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    setMetaByProperty("og:title", fullTitle);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:url", url);
    setMetaByProperty("og:image", image);

    setMetaByName("twitter:title", fullTitle);
    setMetaByName("twitter:description", description);
    setMetaByName("twitter:image", image);

    setStructuredData(structuredData);
  }, [title, description, path, image, structuredData, noindex]);
}

export { SITE_URL, SITE_NAME };
