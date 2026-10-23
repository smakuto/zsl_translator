import { LangCode } from '../types';

/**
 * UI strings in the three supported languages. Kept short and paired with
 * icons everywhere for low-literacy users. Shona/Ndebele strings need review.
 */
const STRINGS = {
  appTitle: { en: 'ZSL Translator', sn: 'ZSL Muturikiri', nd: 'ZSL Umhumushi' },
  offlineActive: { en: 'Offline active', sn: 'Pasina indaneti', nd: 'Kungela-inthanethi' },
  noData: { en: '0 MB data used', sn: 'Hapana data', nd: 'Akula data' },
  cameraMode: { en: 'Sign → Voice', sn: 'Chiratidzo → Izwi', nd: 'Uphawu → Ilizwi' },
  micMode: { en: 'Voice → Sign', sn: 'Izwi → Chiratidzo', nd: 'Ilizwi → Uphawu' },
  start: { en: 'Start', sn: 'Tanga', nd: 'Qala' },
  stop: { en: 'Stop', sn: 'Mira', nd: 'Yima' },
  speak: { en: 'Speak', sn: 'Taura', nd: 'Khuluma' },
  autoSpeak: { en: 'Speak results automatically', sn: 'Taura mhinduro pachayo', nd: 'Khuluma imiphumela ngokwayo' },
  clear: { en: 'Clear', sn: 'Bvisa', nd: 'Sula' },
  done: { en: 'Done', sn: 'Zvapera', nd: 'Kuphelile' },
  listening: { en: 'Listening…', sn: 'Ndiri kuteerera…', nd: 'Ngilalele…' },
  tapToTalk: { en: 'Tap to talk', sn: 'Baya utaure', nd: 'Thinta ukhulume' },
  typeHere: { en: 'Type a message…', sn: 'Nyora pano…', nd: 'Bhala lapha…' },
  output: { en: 'Output language', sn: 'Mutauro', nd: 'Ulimi' },
  signHere: { en: 'Sign in front of the camera', sn: 'Ratidza pamberi pekamera', nd: 'Yenza uphawu phambi kwekhamera' },
  cameraPermission: { en: 'Allow camera to read signs. Video stays on this phone.', sn: 'Bvumira kamera. Vhidhiyo inogara pafoni.', nd: 'Vumela ikhamera. Ividiyo ihlala efonini.' },
  allow: { en: 'Allow', sn: 'Bvumira', nd: 'Vumela' },
  settings: { en: 'Settings', sn: 'Zvirongwa', nd: 'Izilungiselelo' },
  dictionary: { en: 'Dictionary', sn: 'Duramazwi', nd: 'Isichazamazwi' },
  theme: { en: 'Display', sn: 'Chiratidziro', nd: 'Isikrini' },
  darkMode: { en: 'Dark (saves battery)', sn: 'Rima (inochengeta bhatiri)', nd: 'Mnyama (yonga ibhetri)' },
  outdoorMode: { en: 'Outdoor (bright sun)', sn: 'Panze (zuva)', nd: 'Ngaphandle (ilanga)' },
  region: { en: 'Sign region', sn: 'Dunhu rezviratidzo', nd: 'Isifunda sezimpawu' },
  uiLanguage: { en: 'App language', sn: 'Mutauro weapp', nd: 'Ulimi lwe-app' },
  demoEngine: { en: 'Demo engine (mock)', sn: 'Muenzaniso (mock)', nd: 'Isibonelo (mock)' },
  ttsFallback: { en: 'No voice installed for this language — using closest available voice.', sn: 'Hapana izwi reChiShona — tiri kushandisa rimwe.', nd: 'Alikho ilizwi lwalolu limi — sisebenzisa elinye.' },
  search: { en: 'Search signs…', sn: 'Tsvaga…', nd: 'Dinga…' },
  noSigns: { en: 'Signs will appear here', sn: 'Zviratidzo zvichaonekwa pano', nd: 'Izimpawu zizavela lapha' },
  speed: { en: 'Speed', sn: 'Kumhanya', nd: 'Ijubane' },
  unreviewed: { en: 'Starter data – needs Deaf community review', sn: 'Data yekutanga – inoda kuongororwa', nd: 'Idatha yokuqala – idinga ukuhlolwa' },
} satisfies Record<string, Record<LangCode, string>>;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: LangCode): string {
  return STRINGS[key][lang] ?? STRINGS[key].en;
}
