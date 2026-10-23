import { LangCode } from '../../types';
import { SpeechHandlers, SpeechRecognizer } from './stt';

const SAMPLES: Record<LangCode, string[]> = {
  en: ['Hello how are you', 'Where is the hospital', 'Thank you my friend', 'I need help'],
  sn: ['Mhoro makadii', 'Chipatara chiri kupi', 'Ndatenda shamwari', 'Ndinoda mvura'],
  nd: ['Sawubona unjani', 'Isibhedlela singaphi', 'Ngiyabonga mngane', 'Ngifuna amanzi'],
};

/** Simulates streaming offline ASR by emitting partial words then a final transcript. */
export class MockSpeechRecognizer implements SpeechRecognizer {
  readonly id = 'mock';
  readonly label = 'Demo speech (mock)';
  readonly isMock = true;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private counter = 0;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async start(lang: LangCode, handlers: SpeechHandlers): Promise<void> {
    this.stop();
    const sample = SAMPLES[lang][this.counter++ % SAMPLES[lang].length];
    const words = sample.split(' ');
    words.forEach((_, i) => {
      this.timers.push(setTimeout(() => handlers.onPartial(words.slice(0, i + 1).join(' ')), 350 * (i + 1)));
    });
    this.timers.push(setTimeout(() => handlers.onFinal(sample), 350 * (words.length + 1)));
  }

  stop(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
