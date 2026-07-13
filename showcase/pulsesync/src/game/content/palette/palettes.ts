import type { PaletteKey } from '@/game/types/GameTypes';

export interface VisualPalette {
  name: string;
  background: number;
  grid: number;
  primary: number;
  secondary: number;
  accent: number;
  highlight: number;
  danger: number;
  text: string;
}

export const VISUAL_PALETTES: Record<PaletteKey, VisualPalette> = {
  boot: {
    name: 'System Boot',
    background: 0x040712,
    grid: 0x103e5f,
    primary: 0x35e7ff,
    secondary: 0x7d5cff,
    accent: 0xdfff4f,
    highlight: 0xf6fbff,
    danger: 0xff5a7c,
    text: '#edf7ff',
  },
  primer: {
    name: 'Signal Primer',
    background: 0x050918,
    grid: 0x194769,
    primary: 0x48f5ff,
    secondary: 0xff4cb7,
    accent: 0xdfff4f,
    highlight: 0xfafcff,
    danger: 0xff667e,
    text: '#eff9ff',
  },
  cascade: {
    name: 'Cascade',
    background: 0x060616,
    grid: 0x2d3284,
    primary: 0x2de2e6,
    secondary: 0xb467ff,
    accent: 0xfeff78,
    highlight: 0xfdfefe,
    danger: 0xff5d71,
    text: '#f7f9ff',
  },
  overclock: {
    name: 'Overclock',
    background: 0x080311,
    grid: 0x5b1a6b,
    primary: 0x5cf5ff,
    secondary: 0xff3ca9,
    accent: 0xfff36d,
    highlight: 0xffffff,
    danger: 0xff5a66,
    text: '#fff8ff',
  },
  eden: {
    name: 'Gate of Eden',
    background: 0x020915,
    grid: 0x1c6688,
    primary: 0x6af8ff,
    secondary: 0xff4fbe,
    accent: 0xe7ff6b,
    highlight: 0xffffff,
    danger: 0xff6c84,
    text: '#f4feff',
  },
  clean: {
    name: 'Awakening',
    background: 0x04111f,
    grid: 0x2c6077,
    primary: 0x87fdff,
    secondary: 0x7f8aff,
    accent: 0xe6ff8b,
    highlight: 0xffffff,
    danger: 0xff6b7b,
    text: '#f5feff',
  },
};
