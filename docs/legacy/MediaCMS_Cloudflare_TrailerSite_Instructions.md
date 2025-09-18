# Goal

Build a premium trailer gallery site that uses **MediaCMS** as the
content API, **Cloudflare Stream** for vdeo delivery, and a **Next.js
(App Router) + Tailwind + shadcn/ui + Framer Motion** front end. A
password gate landing page shows a centered **neversatisfiedxo** logo
with a single password field and a button labeled **"i submit"** to
unlock the gallery.

------------------------------------------------------------------------

## High‑level Architecture

-   **MediaCMS (Django + DRF):** Stores trailer metadata and exposes
    `/api/videos` (and optional custom `/api/trailers`) including
    `cf_video_uid` and `cf_thumb_uid`. Enable CORS for the front end
    origin.
-   **Cloudflare Stream:** Hosts the actual video files. Front end
    embeds via iframe using the **customer code** + `cf_video_uid`.
    Optional: require **signed URLs** for private playback.
-   **Next.js** (TS) with Tailwind + shadcn/ui + Framer Motion:
    -   Pages: `/enter` (password gate), `/` (gallery), `/video/[id]`
        (detail).
    -   Data layer: **TanStack Query** fetching from MediaCMS.
    -   Forms/filters: **React Hook Form + Zod**.
    -   Theming: **next-themes** (dark default).
    -   Icons: **lucide-react**.

------------------------------------------------------------------------

## Environment Variables (.env / .env.local)

``` bash
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code
MEDIACMS_BASE_URL=https://your-mediacms.example.com
MEDIACMS_API_TOKEN=your_mediacms_api_token
GATE_PASSWORD=choose-a-strong-password
CF_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxx
CF_STREAM_API_TOKEN=cf_api_token_with_stream_permissions
```

------------------------------------------------------------------------

## Repo Layout

    repo/
    ├─ apps/
    │  ├─ mediacms/                    # MediaCMS Django app
    │  └─ web/                         # Next.js app
    │     ├─ app/                      # App Router pages
    │     ├─ components/               # UI & Trailer components
    │     ├─ lib/                      # API + types
    │     ├─ styles/                   # Tailwind globals
    │     └─ package.json
    └─ data/
       └─ VideoDB.csv

------------------------------------------------------------------------

## MediaCMS Extension

Add `TrailerMeta` model with Cloudflare IDs, price, length, creators.
Expose via DRF `/api/trailers`. Include management command to import
from `VideoDB.csv`.

------------------------------------------------------------------------

## CSV Import Command

Use a Django `import_videodb` management command to parse `VideoDB.csv`
and create/update `Video` + `TrailerMeta`. Supports parsing HH:MM:SS
duration strings.

------------------------------------------------------------------------

## Next.js Frontend Setup

1.  `npx create-next-app@latest web --ts`
2.  Install deps:
    `@tanstack/react-query react-hook-form zod next-themes lucide-react framer-motion tailwindcss postcss autoprefixer`
3.  Add shadcn/ui with CLI, generate Button, Card, Dialog, Drawer,
    Input, Tabs, Command, Badge, Skeleton, Sheet, Toast.
4.  Configure Tailwind (`globals.css`, tokens: rounded‑2xl, motion
    timing 150--250ms).

------------------------------------------------------------------------

## Password Gate

-   Page `/enter`: centered **neversatisfiedxo** logo, password input,
    **i submit** button.
-   API `/api/gate`: verifies password from `GATE_PASSWORD`, sets
    cookie.
-   Middleware checks cookie, redirects unauthenticated users to
    `/enter`.

------------------------------------------------------------------------

## Data Layer

-   `lib/types.ts`: `Trailer` type with metadata.
-   `lib/api.ts`: Fetch functions using TanStack Query.
-   Home gallery page uses `useQuery` to load trailers, render with
    skeleton loaders.

------------------------------------------------------------------------

## Cloudflare Player Component

Reusable `<CloudflarePlayer uid={cf_video_uid}>` that renders iframe
embed with customer code from env. Optionally support signed URLs.

------------------------------------------------------------------------

## Trailer Card + Quick Preview

Card shows poster, title, runtime, creators. Hover: subtle scale/shadow.
Quick Preview: Radix Dialog with Cloudflare player. Motion via Framer
Motion.

------------------------------------------------------------------------

## Detail Page

-   Route: `/video/[id]`
-   Hero banner with title, creators, description, price.
-   Sticky mini-player appears after scroll.
-   Related trailers carousel.

------------------------------------------------------------------------

## Filters & Command Palette

-   Desktop: Command palette (⌘K) with search for titles/tags.
-   Mobile: Drawer with tag/checkbox filters (Genre, Year, Length).
-   React Hook Form + Zod validate filters → query params for API.

------------------------------------------------------------------------

## Accessibility

-   Radix provides focus management.
-   Keyboard shortcuts: ESC closes dialogs, visible focus rings.
-   Alt text on thumbnails, iframe titles.

------------------------------------------------------------------------

## SEO

-   Next.js metadata & OpenGraph.
-   OG images from thumbnails.
-   JSON‑LD `VideoObject` with embed URL, description, duration, etc.

------------------------------------------------------------------------

## Build & Run

``` bash
# MediaCMS
python manage.py migrate
python manage.py import_videodb data/VideoDB.csv
python manage.py runserver

# Next.js frontend
cd apps/web
npm run dev
```

------------------------------------------------------------------------

## Acceptance Criteria

-   Landing gate works with **neversatisfiedxo** logo and **i submit**
    button.
-   Gallery loads trailers via API with skeleton loaders.
-   Quick Preview dialog plays Cloudflare Stream embed.
-   Detail page shows metadata + sticky mini-player.
-   CORS enabled for frontend → backend API.
-   Optional: Signed playback supported.

------------------------------------------------------------------------

## Stretch Goals

-   Watchlist (localStorage or user accounts).
-   Analytics dashboard (TanStack Table + Recharts).
-   Payments (Stripe Checkout, prices in cents).
-   Age gate (18+ checkbox on enter).

------------------------------------------------------------------------

## Hand‑off Notes

-   Start with Next.js + Tailwind + shadcn/ui.
-   Implement password gate (API + cookie + middleware).
-   Build gallery, TrailerCard, CloudflarePlayer.
-   Extend MediaCMS with `TrailerMeta` + CSV importer.
-   Verify API and playback end‑to‑end.
-   Add polish: motion, rounded‑2xl, premium dark theme.
