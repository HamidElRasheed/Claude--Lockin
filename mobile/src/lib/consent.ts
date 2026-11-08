import { File, Paths } from 'expo-file-system';

// Remembers on the phone that the privacy card has been read, so it shows only once.
// Stored as a tiny file in the app's own folder; nothing is sent anywhere.
const VERSION = 1;
let memory = false;

function file() {
  return new File(Paths.document, 'privacy-consent.json');
}

export function hasAcceptedPrivacy(): boolean {
  if (memory) return true;
  try {
    const f = file();
    if (!f.exists) return false;
    const saved = JSON.parse(f.textSync()) as { version?: number };
    memory = saved.version === VERSION;
    return memory;
  } catch {
    return false;
  }
}

export function acceptPrivacy() {
  memory = true;
  try {
    const f = file();
    if (!f.exists) f.create();
    f.writeSync(JSON.stringify({ version: VERSION, at: new Date().toISOString() }));
  } catch {
    // Web or a locked folder: the in-memory flag still hides the card for this session.
  }
}
