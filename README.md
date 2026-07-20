# ìlúEats — Customer Web App

> **Your town. Your taste. Delivered.**

The customer-facing storefront for **ìlúEats**, a hyper-local food delivery
network built town-first — starting with Ilisan, Ogun State. This is the Next.js
app diners use to browse local stores, order food, pay from a wallet, and track
deliveries in real time.

It talks to the ìlúEats NestJS backend over a REST API and is deployed on Vercel.

---

## Tech stack

| | |
|---|---|
| **Framework** | Next.js 15 (App Router, React 19, Server Components) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Auth** | Auth.js (NextAuth v5) — credentials + Google OAuth |
| **Payments** | Paystack (hosted checkout + wallet top-ups) |
| **Maps / address** | Google Maps JS API + `@vis.gl/react-google-maps` |
| **Animation** | Framer Motion |
| **Analytics** | Vercel Analytics |

State is handled with React Context providers (one per domain) backed by custom
hooks — no external state library.

---

## Features

- **Marketplace** — browse every local store and its live menu; search across
  stores and products.
- **Cart & checkout** — per-store cart, delivery address with map/autocomplete
  picking, order placement.
- **ìlúEats Wallet** — Paystack-backed balance; top up once, pay with a tap.
- **Order tracking** — live order status plus WhatsApp/SMS updates
  (prepared → rider assigned → delivered).
- **Accounts** — saved addresses, favourites, order history, referrals.
- **Auth** — email/password and Google sign-in.
- **Rider console** — a separate rider panel under `/rider` (login + delivery
  queue) ships in this repo but is outside the customer flow.

---

## Project structure

```
app/                 App Router routes
  [store]/[product]  Store pages & product detail
  cart/ checkout/    Cart and checkout (+ Paystack payment)
  wallet/            Wallet + top-up callback
  orders/            Order history & tracking (/orders/[code])
  account/ addresses/ favorites/ search/ stores/
  rider/             Rider console (login + panel)
  api/auth/          NextAuth route handlers
components/          UI grouped by domain (store, cart, wallet, ui, …)
context/             React Context providers (Cart, Auth, Orders, …)
hooks/               Data + UI hooks (useCart, useWallet, useGeolocation, …)
lib/api/             Typed backend API clients (catalog, orders, wallet, …)
lib/                 Helpers (geo, paystack, pagination, utils)
auth.ts              Auth.js (NextAuth v5) configuration
types/               Shared + next-auth type definitions
docs/API_SPEC.md     Backend API reference
```

---

## Getting started

### Prerequisites

- Node.js 20+
- The ìlúEats backend running locally (defaults to `http://localhost:3000`)

### Setup

```bash
npm install
cp .env.example .env        # then fill in the values below
npm run dev                 # http://localhost:3030
```

### Environment variables

Copy `.env.example` and set:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the NestJS backend |
| `NEXT_PUBLIC_ADMIN_URL` | Admin console URL (separate app) |
| `AUTH_SECRET` | Auth.js secret — `npx auth secret` |
| `NEXTAUTH_URL` | This app's URL |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack **public** key (client-safe) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps **browser** key (referrer-restricted) |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | Map ID for vector maps / advanced markers (`DEMO_MAP_ID` for dev) |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port **3030** |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Deployment

Deployed on **Vercel**. Set the environment variables above in the project
settings; the client-exposed keys (`NEXT_PUBLIC_*`) must be scoped and
referrer/domain-restricted. Production runs at `ilueats.com`.
