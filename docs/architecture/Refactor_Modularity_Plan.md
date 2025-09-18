# Refactor & Modularity Plan

This document describes recommended refactors to keep the project maintainable, swap-friendly, and scalable.

## 1) Feature-first structure + shared libs
```
apps/web/
  app/
    (public)/enter/...
    (protected)/video/[slug]/page.tsx
    (protected)/layout.tsx
  features/
    gate/
      api/
      components/
      hooks/
      lib/
    trailers/
      api/
      components/
      hooks/
      lib/
    player/
      components/
      lib/
    filters/
      components/
      lib/
  shared/
    ui/
    config/
    http/
    types/
    utils/
```
**Why:** Each feature owns its API, components, hooks, and helpers; shared code is isolated.

## 2) Repository layer + DTO→Domain mapping
```ts
// features/trailers/api/trailers.repo.ts
import { http } from "@/shared/http/http";
import { z } from "zod";

const TrailerDTO = z.object({
  id: z.number(), title: z.string(), slug: z.string(), status: z.string(),
  cf_video_uid: z.string(), cf_thumb_uid: z.string().optional(),
  price_cents: z.number(), length_seconds: z.number(),
  creators: z.string().default(""), description: z.string().default("")
});
export type Trailer = z.infer<typeof TrailerDTO>;

export async function listTrailers(params: URLSearchParams): Promise<Trailer[]> {
  const json = await http.get(`/api/trailers?${params.toString()}`);
  return (json.results ?? json).map((r: unknown) => TrailerDTO.parse(r));
}
export async function getTrailer(slug: string): Promise<Trailer> {
  return TrailerDTO.parse(await http.get(`/api/trailers/${slug}`));
}
```

## 3) HTTP client & env centralization
```ts
// shared/http/http.ts
export const http = {
  async get(path: string, init?: RequestInit) {
    const base = process.env.MEDIACMS_BASE_URL!;
    const res = await fetch(`${base}${path}`, {
      headers: {
        Accept: "application/json",
        ...(process.env.MEDIACMS_API_TOKEN ? { Authorization: `Bearer ${process.env.MEDIACMS_API_TOKEN}` } : {}),
      },
      cache: "no-store", ...init
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};
```

```ts
// shared/config/env.ts
import { z } from "zod";
export const Env = z.object({
  NEXT_PUBLIC_SITE_NAME: z.string(),
  NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE: z.string(),
  MEDIACMS_BASE_URL: z.string().url(),
  MEDIACMS_API_TOKEN: z.string().optional(),
}).parse({
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE: process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE,
  MEDIACMS_BASE_URL: process.env.MEDIACMS_BASE_URL,
  MEDIACMS_API_TOKEN: process.env.MEDIACMS_API_TOKEN,
});
```

## 4) Cloudflare adapter (swap‑friendly)
```ts
// features/player/lib/cloudflare.ts
export function embedUrl(idOrToken: string, code = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE!) {
  return `https://customer-${code}.cloudflarestream.com/${idOrToken}/iframe`;
}
export function posterUrl(uid: string, opts?: { time?: number; height?: number }) {
  const t = opts?.time ?? 2, h = opts?.height ?? 720;
  const code = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE!;
  return `https://customer-${code}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?time=${t}&height=${h}`;
}
```

## 5) Hooks for data & UI state
```ts
// features/trailers/hooks/useTrailers.ts
import { useQuery } from "@tanstack/react-query";
import { listTrailers } from "../api/trailers.repo";
export function useTrailers(params: URLSearchParams) {
  return useQuery({ queryKey: ["trailers", params.toString()], queryFn: () => listTrailers(params), staleTime: 30_000 });
}
```

## 6) Filters schema → params
```ts
// features/filters/lib/schema.ts
import { z } from "zod";
export const FiltersSchema = z.object({
  q: z.string().optional(),
  year: z.string().regex(/^[0-9]{4}$/).optional(),
  lengthMin: z.number().int().min(0).optional(),
  lengthMax: z.number().int().min(0).optional(),
  creators: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});
export type Filters = z.infer<typeof FiltersSchema>;
export function toParams(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.year) p.set("year", f.year);
  if (f.lengthMin) p.set("length_min", String(f.lengthMin));
  if (f.lengthMax) p.set("length_max", String(f.lengthMax));
  (f.creators ?? []).forEach((c) => p.append("creators", c));
  (f.tags ?? []).forEach((t) => p.append("tags", t));
  return p;
}
```

## 7) UI façade + tokens
- Re‑export shadcn components from `shared/ui/index.ts` so imports remain stable.
- Keep design tokens (radii, motion, spacing) in `tokens.css`.

## 8) Gate logic helper
```ts
// features/gate/lib/gate.ts
export const GATE_COOKIE = "nsx_gate";
export const Gate = {
  verify(pw: string) { return Boolean(process.env.GATE_PASSWORD && pw === process.env.GATE_PASSWORD); },
  cookieHeader() { const maxAge = 60 * 60 * 12; return `${GATE_COOKIE}=ok; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; },
};
```

## 9) ISR server components for detail
Use RSC + ISR (~60s) on `/video/[slug]` for SEO; keep gallery client-side for filters.

## 10) Types from DRF OpenAPI
- Add `drf-spectacular` to MediaCMS and expose `/api/schema/`.
- Generate TS types with `openapi-typescript` into `shared/types/openapi.d.ts`.

## 11) Tests & CI
- Unit: mapping helpers, URL builders.
- Component: TrailerCard, Player.
- E2E: gate → gallery → preview plays (Playwright).
- CI: `tsc --noEmit`, `eslint`, `vitest`, `playwright test`, `next build`.

## 12) Optional Turborepo packages
```
packages/
  config/   # TS/ESLint/Tailwind presets
  ui/       # shadcn + tokens
  api/      # generated OpenAPI client
  utils/    # shared utilities
```
