# Colorful Kart

An original, colorful four-racer arcade game built with Three.js, TypeScript, and Vite.

## Play

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5188`.

- `W` / `↑`: accelerate beyond the kart's gentle auto-cruise
- `S` / `↓`: brake
- `A D` / `← →`: steer
- `Space`: use the held turbo or banana
- `R`: restart after the race

Touch controls appear automatically on mobile-sized or coarse-pointer devices.

## Game loop

Four racers compete for three laps. Mystery boxes award turbo boosts or banana traps, glowing strips give an immediate speed boost, and the final screen ranks every racer by finish time.

## Checks

```bash
npm test
npm run build
```
