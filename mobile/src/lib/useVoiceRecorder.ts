import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';

export class MicPermissionError extends Error {}

// Speech, not music: mono 16 kHz at 32 kbps is ~4x smaller than HIGH_QUALITY
// (stereo 44.1 kHz, 128 kbps), so uploads are much faster. Plenty for transcription.
const SPEECH_PRESET: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
};

// Tap-to-talk recording. prepare() early (when the screen opens) so the first word
// is not cut off, start() on the first tap, stop() on the second returns the file uri.
// The file is only sent to /transcribe and deleted on the phone right after.
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(SPEECH_PRESET);
  const ready = useRef<Promise<void> | null>(null);
  const starting = useRef<Promise<void> | null>(null);

  const prepare = useCallback(() => {
    if (!ready.current) {
      const preparing = (async () => {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) throw new MicPermissionError('Mikrofon ikke tillatt');
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
      })();
      ready.current = preparing;
      preparing.catch(() => {
        if (ready.current === preparing) ready.current = null;
      });
    }
    return ready.current;
  }, [recorder]);

  const start = useCallback(() => {
    starting.current = prepare().then(() => {
      // A prepared recorder is used once; the next start() prepares again.
      ready.current = null;
      recorder.record();
    });
    return starting.current;
  }, [prepare, recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    const pending = starting.current;
    starting.current = null;
    if (!pending) return null;
    try {
      await pending;
    } catch {
      return null;
    }
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    return recorder.uri;
  }, [recorder]);

  // Give the audio session back when the screen closes.
  useEffect(() => () => void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined), []);

  return { prepare, start, stop };
}
