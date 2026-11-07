import { File } from 'expo-file-system';

// Audio is never kept: remove the local recording as soon as it has been sent,
// also when transcription fails.
export function deleteRecording(uri: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best effort: the OS clears the cache folder anyway.
  }
}
