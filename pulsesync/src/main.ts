import './style.css';
import { createGame } from '@/game/boot/createGame';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Failed to mount Pulse Sync: missing #app root element.');
}

app.innerHTML = `
  <div class="shell">
    <div class="shell__chrome">
      <div class="shell__title-block">
        <span class="shell__eyebrow">Interactive Music Shooter Demo</span>
        <h1 class="shell__title">Pulse Sync</h1>
      </div>
      <p class="shell__subtitle">
        Lock, release, and rupture the sleeping signal core.
      </p>
    </div>
    <div class="game-frame">
      <div id="game-root" class="game-root" aria-label="Pulse Sync game canvas"></div>
    </div>
  </div>
`;

createGame('game-root');
