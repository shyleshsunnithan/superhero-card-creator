# CardForge AI

Transform your photo into a custom collectible trading card powered by Gemini AI. Upload a portrait, pick a theme, customize optional character details and stats, and generate an interactive holographic card ready to download or share.

## Features

- **8 Collectible Themes**: Cyberpunk, Fantasy, Retro Arcade, Zombie Apocalypse, Superhero, Sci-Fi, Horror, and Mythology.
- **AI-Generated Card Metadata**: Generates character name, title, element, rarity (`Common`, `Rare`, `Epic`, `Legendary`), stats, flavor text, and matching color palette from your uploaded photo.
- **Custom Overrides**: Optionally specify a custom character name, description, and up to 3 custom stats before forging.
- **AI Artwork Transformation**: Reimagines your portrait in the selected theme's art style while preserving facial features.
- **Interactive 3D Holographic Card**: Tilt-responsive card display with holographic glare overlay and synthesized Web Audio UI sound effects.
- **Export & Share**: Download a high-resolution PNG of your card (`html-to-image`) or share directly to social platforms.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, `html-to-image`
- **Backend**: Node.js, Express 5, `@google/genai` (server-side Gemini API integration)

## Getting Started

### Prerequisites

- Node.js 22+
- A Gemini API key

### Environment Setup

Copy `.env.example` to `.env.local` and set your API key:

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Install & Run Locally

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

### Production Build

```bash
npm run build
NODE_ENV=production npm start
```

## Scripts

- `npm run dev` — Starts the Express + Vite development server on port 3000.
- `npm run build` — Builds the client bundle into `dist/`.
- `npm start` — Runs the production Express server (`node server.ts`).
- `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`).

## Architecture

- `server.ts` — Express server handling `/api/card/metadata` and `/api/card/transform` endpoints with `@google/genai`, plus Vite middleware in development and static asset serving in production.
- `services/geminiService.ts` — Client-side helpers for image encoding and calling the server API routes.
- `App.tsx` — Main application flow for uploading photos, choosing themes, setting custom attributes, and downloading/sharing cards.
- `components/CardDisplay.tsx` — Interactive 3D tilt trading card renderer with theme-specific typography and rarity styling.
