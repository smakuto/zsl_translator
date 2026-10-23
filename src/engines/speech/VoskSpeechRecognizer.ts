import { PermissionsAndroid, Platform, TurboModuleRegistry } from 'react-native';
import type { TurboModule } from 'react-native';
import { LangCode } from '../../types';
import { SpeechHandlers, SpeechRecognizer } from './stt';

type Subscription = { remove(): void };
type Emitter<T> = (cb: (v: T) => void) => Subscription;

/** Subset of react-native-vosk's TurboModule spec (module name "Vosk"). */
interface VoskSpec extends TurboModule {
  loadModel(path: string): Promise<void>;
  unload(): void;
  start(options?: { grammar?: string[]; timeout?: number }): Promise<void>;
  stop(): void;
  readonly onPartialResult: Emitter<string>;
  readonly onResult: Emitter<string>;
  readonly onFinalResult: Emitter<string>;
  readonly onError: Emitter<string>;
}

/**
 * Model folders bundled under android/app/src/main/assets via the
 * react-native-vosk config plugin. See docs/ML_MODELS.md for sourcing:
 * English uses the official vosk-model-small-en-us (~40MB). Shona/Ndebele need
 * custom-trained Kaldi/Vosk models; until then grammar mode over the
 * dictionary vocabulary gives usable keyword recognition.
 */
export const VOSK_MODELS: Record<LangCode, string> = {
  en: 'model-en',
  sn: 'model-sn',
  nd: 'model-nd',
};

/** Vosk emits JSON strings like {"text": "..."} or {"partial": "..."}; tolerate plain strings too. */
export function parseVoskPayload(payload: string): string {
  try {
    const parsed = JSON.parse(payload);
    return String(parsed.text ?? parsed.partial ?? '').trim();
  } catch {
    return payload.trim();
  }
}

export class VoskSpeechRecognizer implements SpeechRecognizer {
  readonly id = 'vosk';
  readonly label = 'Vosk (offline)';
  readonly isMock = false;
  private readonly native: VoskSpec | null = TurboModuleRegistry.get<VoskSpec>('Vosk') ?? null;
  private loadedLang: LangCode | null = null;
  private subs: Subscription[] = [];

  async isAvailable(lang: LangCode): Promise<boolean> {
    if (!this.native) return false;
    try {
      await this.ensureModel(lang);
      return true;
    } catch {
      return false;
    }
  }

  async start(lang: LangCode, handlers: SpeechHandlers, vocabulary?: string[]): Promise<void> {
    if (!this.native) throw new Error('Vosk native module not linked');
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Microphone permission denied');
    }
    await this.ensureModel(lang);
    this.removeSubs();
    this.subs = [
      this.native.onPartialResult((p) => handlers.onPartial(parseVoskPayload(p))),
      this.native.onResult((r) => handlers.onFinal(parseVoskPayload(r))),
      this.native.onFinalResult((r) => handlers.onFinal(parseVoskPayload(r))),
      this.native.onError((e) => handlers.onError(String(e))),
    ];
    const grammar = vocabulary?.length ? [...vocabulary, '[unk]'] : undefined;
    await this.native.start({ grammar });
  }

  stop(): void {
    this.native?.stop();
    this.removeSubs();
  }

  private async ensureModel(lang: LangCode) {
    if (!this.native || this.loadedLang === lang) return;
    await this.native.loadModel(VOSK_MODELS[lang]);
    this.loadedLang = lang;
  }

  private removeSubs() {
    this.subs.forEach((s) => s.remove());
    this.subs = [];
  }
}
