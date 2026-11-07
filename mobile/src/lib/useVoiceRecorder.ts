import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useRef } from 'react';

export class MicPermissionError extends Error {}

// Hold-to-talk recording. start() on press-in, stop() on release returns the file uri.
// The file is only sent to /transcribe; the backend deletes it right away.
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const starting = useRef<Promise<void> | null>(null);

  const start = useCallback(() => {
    starting.current = (async () => {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) throw new MicPermissionError('Mikrofon ikke tillatt');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    })();
    return starting.current;
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    try {
      await starting.current;
    } catch {
      return null;
    }
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    return recorder.uri;
  }, [recorder]);

  return { start, stop };
}
