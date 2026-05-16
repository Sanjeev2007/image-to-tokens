# Image to Design Tokens

Free CSS, Tailwind config, Style Dictionary JSON, and a ZIP bundle. Heuristic v1 — AI version coming soon.

**Live:** [image-to-tokens.vercel.app](https://image-to-tokens.vercel.app) *(URL pending Vercel deploy)*

## What it does

- Drop an image to extract its dominant color and 8 additional swatches.
- Automatically assigns semantic roles (primary, secondary, etc.) to the extracted colors.
- Exports a complete design system in 4 formats: CSS variables, Tailwind config, Style Dictionary JSON, and a ready-to-use ZIP bundle.

## Tech stack

- Vite 5
- React 18
- TypeScript
- Tailwind 3
- color-thief-ts
- react-dropzone
- jszip
- lucide-react

## Development

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm build
```

## License

MIT

## Status

Heuristic v1. AI-vision version (Niche Tools) coming as a separate product.
