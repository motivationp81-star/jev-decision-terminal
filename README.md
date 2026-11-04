# JEV / DECISION PIPELINE — Live Terminal (Simulated)

A fully interactive, continuously animated web dashboard that recreates the
visual system of the reference video: a dense black HUD, a wide tilted plane
of decision labels, braided white-core light rivers, travelling neon signal
boxes with result strips, a lens highlight, rotating colour cases
(red → green → gold → cyan → pink → purple) and a fixed bottom analytics strip.

**All data is simulated.** There is no real market feed and no real decision
backend; counters, prices and logs are generated locally by `src/engine.ts`.

## Run locally

```sh
cp index.dev.html index.html   # restore the Vite dev entry (the repo root
                               # index.html is the production build for Pages)
npm install
npm run dev        # develop
npm run build      # type-check + production build into dist/
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · HTML5 Canvas (stage) ·
Lightweight Charts (confidence stream) · Framer Motion (panel transitions)

## Controls

- Start / Stop, Pause / Resume, Reset
- Theme: auto colour cycle or fixed green / pink / cyan / purple / gold / red
- Animation speed 0.25× – 3×
- Freeze individual column groups (C1–C5)
- Fullscreen
- Real-time IST clock in the header

## Layout of this repo

- `index.html` + `assets/` — the production build, served by GitHub Pages
- `src/` — full source code
- `index.dev.html` — the Vite dev entry (see above)
