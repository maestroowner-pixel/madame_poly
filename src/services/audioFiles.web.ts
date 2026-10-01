/**
 * В браузере файловой системы Expo нет: озвучка живёт как blob-ссылка, запись
 * приходит от MediaRecorder тоже blob-ссылкой. Тип записи зависит от браузера
 * (Chrome — webm, Safari — mp4), его и отдаём серверу, чтобы Whisper понял.
 */
let previous: string | null = null;

export function saveAudio(bytes: Uint8Array): string {
  // Плеер держит одну реплику за раз — прошлую отпускаем, чтобы не копить память.
  if (previous) setTimeout((url: string) => URL.revokeObjectURL(url), 60_000, previous);
  previous = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'audio/mpeg' }));
  return previous;
}

export async function readRecording(uri: string): Promise<{ bytes: Uint8Array<ArrayBuffer>; type: string }> {
  const blob = await (await fetch(uri)).blob();
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: blob.type || 'audio/webm' };
}
