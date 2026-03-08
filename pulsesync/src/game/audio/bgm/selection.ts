import Phaser from 'phaser';
import {
  getDefaultProceduralBGMSongId,
  getProceduralBGMSong,
  getProceduralBGMSongs,
} from '@/game/audio/bgm/catalog';

const REGISTRY_KEY = 'bgm:selected-song-id';

export function getSelectedProceduralBGMSongId(scene: Phaser.Scene): string {
  const stored = scene.registry.get(REGISTRY_KEY);
  if (typeof stored === 'string' && getProceduralBGMSong(stored).id === stored) {
    return stored;
  }

  const fallback = getDefaultProceduralBGMSongId();
  scene.registry.set(REGISTRY_KEY, fallback);
  return fallback;
}

export function setSelectedProceduralBGMSongId(scene: Phaser.Scene, songId: string): string {
  const resolved = getProceduralBGMSong(songId);
  scene.registry.set(REGISTRY_KEY, resolved.id);
  return resolved.id;
}

export function cycleSelectedProceduralBGMSong(scene: Phaser.Scene, step = 1): string {
  const songs = getProceduralBGMSongs();
  const currentId = getSelectedProceduralBGMSongId(scene);
  const currentIndex = songs.findIndex((song) => song.id === currentId);
  const nextIndex = (currentIndex + step + songs.length) % songs.length;
  return setSelectedProceduralBGMSongId(scene, songs[nextIndex].id);
}
