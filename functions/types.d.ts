// TypeScript definitions for Cloudflare Pages Functions

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

interface PagesFunction<Env = unknown> {
  (context: EventContext<Env, any, Record<string, unknown>>): Response | Promise<Response>;
}

interface EventContext<Env, P extends string, Data> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Data;
}
