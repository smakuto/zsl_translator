import { LangCode } from '../../types';

export interface SpeechHandlers {
  onPartial(text: string): void;
  onFinal(text: string): void;
  onError(message: string): void;
}

export interface SpeechRecognizer {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  isAvailable(lang: LangCode): Promise<boolean>;
  /** `vocabulary` lets grammar-capable engines (Vosk) constrain decoding to known words. */
  start(lang: LangCode, handlers: SpeechHandlers, vocabulary?: string[]): Promise<void>;
  stop(): void;
}
