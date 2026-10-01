import { Directory, File, Paths } from 'expo-file-system';

/** Озвучка складывается в кэш — её всегда можно перегенерировать. */
const AUDIO_DIR = new Directory(Paths.cache, 'tts');

/** Сохраняет mp3 и отдаёт uri, который понимает плеер. */
export function saveAudio(bytes: Uint8Array): string {
  if (!AUDIO_DIR.exists) AUDIO_DIR.create({ intermediates: true });
  const file = new File(AUDIO_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}

/** Байты записи с микрофона и её тип — для Whisper. */
export async function readRecording(uri: string): Promise<{ bytes: Uint8Array<ArrayBuffer>; type: string }> {
  return { bytes: await new File(uri).bytes(), type: 'audio/m4a' };
}
