# Car Marketplace - Frontend

React + TypeScript + Vite single-page app for the Car Marketplace API. Talks to the Django backend in `../back-end`. See the [root README](../README.md) for the full project overview, screenshots, and how to run the backend.

## Stack

- React 19 + React Router 7 (client-side routing)
- TanStack Query for server-state caching
- Axios with a JWT access/refresh interceptor
- Tailwind CSS v4
- A small custom i18n layer (`src/i18n/`) for the UK/EN toggle
- react-hot-toast for notifications

## Setup

```bash
npm install
cp .env.example .env.local   # adjust VITE_API_BASE_URL if needed
npm run dev
```

The app expects the backend at `http://localhost:8000` by default. CORS for `http://localhost:5173` is already enabled on the backend in `DEBUG` mode.

## Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - type-check (`tsc -b`) and build for production
- `npm run preview` - preview the production build locally
- `npm run lint` - run oxlint

## Structure

```
src/
  api/          one file per backend resource (auth, cars, images, ...)
  components/   shared UI building blocks
  context/      AuthContext (JWT session state)
  hooks/        useProfile, useFavorites, useSubscriptionStatus, ...
  i18n/         translations dictionary + language context
  lib/          axios client, query client, formatting helpers
  pages/        one component per route
  types.ts      shapes mirroring the DRF serializers
```

## Notes on the API integration

- The car list has no images in `/api/cars/`; each `CarCard` fetches `/api/cars/{id}/images/` separately.
- There is no "list my cars" or "seller by id" endpoint, so "My listings" and the reviews section walk every page of `/api/cars/` / `/api/reviews/` client-side and filter/aggregate in the browser. Fine at this project's scale; would need a backend filter if the catalog grows large.
- Multipart uploads (car images, avatar) must **not** set `Content-Type` manually - the browser needs to add the multipart boundary itself.
