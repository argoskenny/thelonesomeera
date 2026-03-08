import Phaser from 'phaser';
import { GAME_CONFIG } from '@/game/content/config/gameConfig';
import { BootScene } from '@/game/scenes/BootScene';
import { DemoScene } from '@/game/scenes/DemoScene';
import { HowToPlayScene } from '@/game/scenes/HowToPlayScene';
import { MenuScene } from '@/game/scenes/MenuScene';
import { ResultScene } from '@/game/scenes/ResultScene';

let activeGame: Phaser.Game | null = null;

export function createGame(parent: string): Phaser.Game {
  if (activeGame) {
    return activeGame;
  }

  activeGame = new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    backgroundColor: '#050816',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_CONFIG.width,
      height: GAME_CONFIG.height,
    },
    render: {
      antialias: true,
      pixelArt: false,
      transparent: false,
    },
    scene: [BootScene, MenuScene, HowToPlayScene, DemoScene, ResultScene],
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
  });

  return activeGame;
}
