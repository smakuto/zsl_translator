import { LangCode } from '../../types';
import { MockSpeechRecognizer } from './MockSpeechRecognizer';
import { SpeechRecognizer } from './stt';
import { VoskSpeechRecognizer } from './VoskSpeechRecognizer';

export * from './stt';
export * from './tts';

const vosk = new VoskSpeechRecognizer();
const mock = new MockSpeechRecognizer();

/** Prefer real offline ASR (Vosk) when its native module + model exist; else the mock. */
export async function getSpeechRecognizer(lang: LangCode): Promise<SpeechRecognizer> {
  return (await vosk.isAvailable(lang)) ? vosk : mock;
}
