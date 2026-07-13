export type ToneModule = typeof import('tone');

let tonePromise: Promise<ToneModule> | null = null;

export function getTone(): Promise<ToneModule> {
  tonePromise ??= import('tone');
  return tonePromise;
}

export async function resumeToneContext(): Promise<ToneModule> {
  const Tone = await getTone();
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }

  if (Tone.context.state !== 'running') {
    await Tone.context.resume();
  }

  return Tone;
}
