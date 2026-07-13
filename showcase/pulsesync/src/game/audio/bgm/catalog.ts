import type { ProceduralBGMSongDefinition } from '@/game/audio/bgm/types';
import { FACTORY_NULL_SONG } from '@/game/audio/bgm/songs/factoryNullSong';
import { MIDNIGHT_TRANSIT_SONG } from '@/game/audio/bgm/songs/midnightTransitSong';
import { SKYLINE_REVERIE_SONG } from '@/game/audio/bgm/songs/skylineReverieSong';
import { SIGNAL_IGNITION_SONG } from '@/game/audio/bgm/songs/signalIgnitionSong';

const SONGS: ProceduralBGMSongDefinition[] = [
  SIGNAL_IGNITION_SONG,
  FACTORY_NULL_SONG,
  SKYLINE_REVERIE_SONG,
  MIDNIGHT_TRANSIT_SONG,
];
const DEFAULT_SONG_ID = SONGS[0].id;
const SONGS_BY_ID = new Map(SONGS.map((song) => [song.id, song]));

export function getProceduralBGMSongs(): ProceduralBGMSongDefinition[] {
  return SONGS;
}

export function getDefaultProceduralBGMSong(): ProceduralBGMSongDefinition {
  return SONGS[0];
}

export function getProceduralBGMSong(songId?: string | null): ProceduralBGMSongDefinition {
  if (!songId) {
    return getDefaultProceduralBGMSong();
  }

  return SONGS_BY_ID.get(songId) ?? getDefaultProceduralBGMSong();
}

export function getDefaultProceduralBGMSongId(): string {
  return DEFAULT_SONG_ID;
}
