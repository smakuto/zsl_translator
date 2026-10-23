import { generateKeyframes } from '../translation/keyframes';
import type { DictionaryData } from '../translation/dictionary';
import {
  Keyframe,
  LangCode,
  PhraseTemplate,
  SignDescriptor,
  SignEntry,
  SignRegion,
  TranslationEntry,
} from '../types';

/**
 * STARTER DATASET — NOT LINGUISTICALLY VALIDATED.
 *
 * Sign descriptors are placeholders that drive the vector avatar; they are not
 * claims about how ZSL signs are articulated. Shona/Ndebele strings are common
 * everyday forms but still need review by native speakers. Before release,
 * replace/verify every row with Deaf ZSL signers (e.g. via the Deaf Zimbabwe
 * Trust / ZIMCARE / university ZSL programmes) and mark `reviewed: true`.
 */
export const SEED_VERSION = 1;

type Row = [
  gloss: string,
  category: string,
  en: string,
  sn: string,
  nd: string,
  descriptor: SignDescriptor,
  aliases?: Partial<Record<LangCode, string[]>>,
];

const d = (hs: SignDescriptor['hs'], loc: SignDescriptor['loc'], move: SignDescriptor['move'], extra: Partial<SignDescriptor> = {}): SignDescriptor => ({ hs, loc, move, ...extra });

const ROWS: Row[] = [
  ['HELLO', 'greeting', 'Hello', 'Mhoro', 'Sawubona', d('flat', 'forehead', 'outward', { face: 'smile' }), { en: ['hi', 'hey'], sn: ['mhoroi', 'mhoro'], nd: ['salibonani', 'sawubona'] }],
  ['GOOD-MORNING', 'greeting', 'Good morning', 'Mangwanani', 'Livukile', d('flat', 'chin', 'up', { face: 'smile' }), { en: ['morning'], nd: ['uvukile'] }],
  ['GOOD-AFTERNOON', 'greeting', 'Good afternoon', 'Masikati', 'Litshonile', d('flat', 'chin', 'outward', { face: 'smile' }), { en: ['good evening'], sn: ['manheru'] }],
  ['GOODBYE', 'greeting', 'Goodbye', 'Chisarai', 'Lisale kuhle', d('open', 'side', 'wave'), { en: ['bye'], sn: ['famba zvakanaka', 'chisara'], nd: ['sala kuhle', 'uhambe kuhle'] }],
  ['THANK-YOU', 'courtesy', 'Thank you', 'Ndatenda', 'Ngiyabonga', d('flat', 'chin', 'outward', { face: 'smile' }), { en: ['thanks'], sn: ['mazvita', 'maita basa'], nd: ['siyabonga'] }],
  ['PLEASE', 'courtesy', 'Please', 'Ndapota', 'Ngicela', d('flat', 'chest', 'circle'), { sn: ['ndokumbirawo'], nd: ['ake'] }],
  ['SORRY', 'courtesy', 'Sorry', 'Ndine urombo', 'Uxolo', d('fist', 'chest', 'circle', { face: 'furrowed' }), { sn: ['pamusoroi'] }],
  ['YES', 'response', 'Yes', 'Hongu', 'Yebo', d('fist', 'neutral', 'tap'), { en: ['yeah', 'ok', 'okay'], sn: ['ehe'] }],
  ['NO', 'response', 'No', 'Kwete', 'Hatshi', d('v', 'neutral', 'twist', { face: 'headshake' }), { en: ['not', "don't", 'dont'], sn: ['aiwa'], nd: ['hayi'] }],
  ['HELP', 'emergency', 'Help', 'Rubatsiro', 'Usizo', d('thumb', 'chest', 'up', { twoHanded: true, face: 'raised' }), { en: ['assist', 'assistance'], sn: ['batsira', 'ndibatsirei', 'batsirai'], nd: ['nceda', 'ngincede', 'sizani'] }],
  ['WATER', 'needs', 'Water', 'Mvura', 'Amanzi', d('v', 'chin', 'tap')],
  ['FOOD', 'needs', 'Food', 'Chikafu', 'Ukudla', d('o', 'mouth', 'tap'), { sn: ['sadza'], nd: ['isitshwala'] }],
  ['TOILET', 'places', 'Toilet', 'Chimbuzi', 'Indlu yangasese', d('fist', 'neutral', 'twist'), { en: ['bathroom', 'restroom'], nd: ['ithoyilethi'] }],
  ['HOSPITAL', 'places', 'Hospital', 'Chipatara', 'Isibhedlela', d('v', 'side', 'down'), { en: ['clinic'], sn: ['kiriniki'], nd: ['ikliniki'] }],
  ['DOCTOR', 'people', 'Doctor', 'Chiremba', 'Udokotela', d('c', 'side', 'tap'), { en: ['nurse'], sn: ['mukoti'], nd: ['unesi'] }],
  ['POLICE', 'emergency', 'Police', 'Mapurisa', 'Amapholisa', d('c', 'chest', 'tap')],
  ['SCHOOL', 'places', 'School', 'Chikoro', 'Isikolo', d('flat', 'neutral', 'tap', { twoHanded: true })],
  ['HOME', 'places', 'Home', 'Kumba', 'Ekhaya', d('o', 'chin', 'down'), { en: ['house'], sn: ['imba'], nd: ['indlu'] }],
  ['MONEY', 'needs', 'Money', 'Mari', 'Imali', d('o', 'neutral', 'tap', { twoHanded: true }), { en: ['cash'] }],
  ['KOMBI', 'transport', 'Kombi', 'Kombi', 'Ikhombi', d('c', 'neutral', 'outward', { twoHanded: true }), { en: ['bus', 'taxi', 'minibus'], sn: ['bhazi'], nd: ['ibhasi'] }],
  ['ELECTRICITY', 'needs', 'Electricity', 'Magetsi', 'Umbane', d('point', 'neutral', 'down', { twoHanded: true }), { en: ['power', 'zesa', 'load shedding'] }],
  ['PAIN', 'health', 'Pain', 'Kurwadziwa', 'Ubuhlungu', d('point', 'chest', 'twist', { twoHanded: true, face: 'furrowed' }), { en: ['hurt', 'hurts', 'ache'], sn: ['kurwadza', 'zvinorwadza'], nd: ['kuyabuhlungu'] }],
  ['SICK', 'health', 'Sick', 'Kurwara', 'Ukugula', d('open', 'forehead', 'tap', { face: 'furrowed' }), { en: ['ill'], sn: ['ndiri kurwara'], nd: ['ngiyagula'] }],
  ['MOTHER', 'people', 'Mother', 'Amai', 'Umama', d('open', 'chin', 'tap'), { en: ['mom', 'mum', 'mama'] }],
  ['FATHER', 'people', 'Father', 'Baba', 'Ubaba', d('open', 'forehead', 'tap'), { en: ['dad', 'papa'] }],
  ['CHILD', 'people', 'Child', 'Mwana', 'Umntwana', d('flat', 'belly', 'down'), { en: ['baby', 'kid'], sn: ['vana'], nd: ['abantwana'] }],
  ['FRIEND', 'people', 'Friend', 'Shamwari', 'Umngane', d('point', 'neutral', 'twist', { twoHanded: true }), { nd: ['umhlobo'] }],
  ['DEAF', 'identity', 'Deaf', 'Matsi', 'Isacuthe', d('point', 'mouth', 'down'), { en: ['hard of hearing'] }],
  ['ME', 'pronoun', 'I', 'Ini', 'Mina', d('point', 'chest', 'tap'), { en: ['me', 'my', 'myself', 'mine'], sn: ['ndini', 'wangu', 'rangu'], nd: ['lami', 'wami'] }],
  ['YOU', 'pronoun', 'You', 'Iwe', 'Wena', d('point', 'neutral', 'outward'), { en: ['your', 'yours'], sn: ['imi', 'wako'], nd: ['lina', 'wakho'] }],
  ['NAME', 'identity', 'Name', 'Zita', 'Ibizo', d('v', 'neutral', 'tap', { twoHanded: true }), { en: ['called'] }],
  ['WHERE', 'question', 'Where', 'Kupi', 'Ngaphi', d('point', 'neutral', 'wave', { face: 'furrowed' }), { sn: ['kupi?'], nd: ['kuphi'] }],
  ['WHAT', 'question', 'What', 'Chii', 'Kuyini', d('open', 'neutral', 'wave', { twoHanded: true, face: 'furrowed' }), { sn: ['chiiko'], nd: ['yini'] }],
  ['HOW', 'question', 'How', 'Sei', 'Njani', d('c', 'neutral', 'twist', { twoHanded: true, face: 'furrowed' })],
  ['WANT', 'verb', 'Want', 'Kuda', 'Ukufuna', d('c', 'chest', 'inward', { twoHanded: true }), { en: ['wants', 'would like'], sn: ['ndinoda', 'ndoda'], nd: ['ngifuna', 'funa'] }],
  ['NEED', 'verb', 'Need', 'Kuda zvikuru', 'Ukudinga', d('point', 'neutral', 'down'), { en: ['needs', 'must'], nd: ['ngidinga', 'dinga'] }],
  ['GO', 'verb', 'Go', 'Kuenda', 'Ukuya', d('point', 'neutral', 'outward', { twoHanded: true }), { en: ['going', 'leave'], sn: ['enda', 'ndoenda', 'ndiri kuenda'], nd: ['hamba', 'ngiyahamba'] }],
  ['COME', 'verb', 'Come', 'Huya', 'Woza', d('point', 'neutral', 'inward'), { en: ['coming'], sn: ['uya', 'huyai'], nd: ['wozani'] }],
  ['EAT', 'verb', 'Eat', 'Kudya', 'Ukudla', d('o', 'mouth', 'tap'), { en: ['eating', 'hungry'], sn: ['dya', 'nzara'], nd: ['dla', 'indlala'] }],
  ['DRINK', 'verb', 'Drink', 'Kunwa', 'Ukunatha', d('c', 'mouth', 'up'), { en: ['thirsty'], sn: ['nwa', 'nyota'], nd: ['natha', 'ukoma'] }],
  ['UNDERSTAND', 'verb', 'Understand', 'Kunzwisisa', 'Ukuzwisisa', d('point', 'forehead', 'up'), { en: ['understood'], sn: ['nzwisisa', 'ndanzwisisa'], nd: ['zwisisa', 'ngiyezwisisa'] }],
  ['TODAY', 'time', 'Today', 'Nhasi', 'Lamuhla', d('y', 'neutral', 'down', { twoHanded: true }), { en: ['now'], sn: ['izvozvi'], nd: ['khathesi'] }],
  ['TOMORROW', 'time', 'Tomorrow', 'Mangwana', 'Kusasa', d('thumb', 'chin', 'outward')],
  ['GOOD', 'describe', 'Good', 'Zvakanaka', 'Kuhle', d('thumb', 'neutral', 'outward', { face: 'smile' }), { en: ['fine', 'great', 'well'], sn: ['zvakanaka', 'ndiripo'], nd: ['ngikhona', 'kulungile'] }],
  ['BAD', 'describe', 'Bad', 'Zvakaipa', 'Kubi', d('flat', 'chin', 'down', { face: 'furrowed' })],
];

/** Regional (dialectal) variants. Model labels use GLOSS~BYO / GLOSS~HRE. */
const REGIONAL_VARIANTS: [gloss: string, region: SignRegion, descriptor: SignDescriptor][] = [
  ['HELLO', 'bulawayo', d('open', 'side', 'wave', { face: 'smile' })],
  ['WATER', 'bulawayo', d('c', 'mouth', 'up')],
  ['MOTHER', 'bulawayo', d('flat', 'chin', 'down')],
  ['SCHOOL', 'bulawayo', d('o', 'neutral', 'circle', { twoHanded: true })],
  ['THANK-YOU', 'bulawayo', d('flat', 'mouth', 'down', { face: 'smile' })],
];

export const SEED_PHRASES: PhraseTemplate[] = [
  { id: 'greet-how-are-you', pattern: ['HELLO', 'HOW', 'YOU'], text: { en: 'Hello, how are you?', sn: 'Mhoro, makadii?', nd: 'Sawubona, unjani?' } },
  { id: 'how-are-you', pattern: ['HOW', 'YOU'], text: { en: 'How are you?', sn: 'Makadii?', nd: 'Unjani?' } },
  { id: 'my-name', pattern: ['ME', 'NAME', '$WORD'], text: { en: 'My name is {word}.', sn: 'Zita rangu ndi{word}.', nd: 'Ibizo lami ngu{word}.' } },
  { id: 'your-name', pattern: ['YOU', 'NAME', 'WHAT'], text: { en: 'What is your name?', sn: 'Zita rako ndiani?', nd: 'Ibizo lakho ngubani?' } },
  { id: 'need-help', pattern: ['ME', 'NEED', 'HELP'], text: { en: 'I need help.', sn: 'Ndinoda rubatsiro.', nd: 'Ngidinga usizo.' } },
  { id: 'help-me', pattern: ['HELP', 'ME'], text: { en: 'Please help me.', sn: 'Ndapota ndibatsirei.', nd: 'Ngicela ungincede.' } },
  { id: 'want-water', pattern: ['ME', 'WANT', 'WATER'], text: { en: 'I want water.', sn: 'Ndinoda mvura.', nd: 'Ngifuna amanzi.' } },
  { id: 'want-food', pattern: ['ME', 'WANT', 'FOOD'], text: { en: 'I want food.', sn: 'Ndinoda chikafu.', nd: 'Ngifuna ukudla.' } },
  { id: 'where-hospital', pattern: ['WHERE', 'HOSPITAL'], text: { en: 'Where is the hospital?', sn: 'Chipatara chiri kupi?', nd: 'Isibhedlela singaphi?' } },
  { id: 'hospital-where', pattern: ['HOSPITAL', 'WHERE'], text: { en: 'Where is the hospital?', sn: 'Chipatara chiri kupi?', nd: 'Isibhedlela singaphi?' } },
  { id: 'where-toilet', pattern: ['TOILET', 'WHERE'], text: { en: 'Where is the toilet?', sn: 'Chimbuzi chiri kupi?', nd: 'Indlu yangasese ingaphi?' } },
  { id: 'where-kombi', pattern: ['KOMBI', 'WHERE'], text: { en: 'Where is the kombi?', sn: 'Kombi iri kupi?', nd: 'Ikhombi ingaphi?' } },
  { id: 'me-deaf', pattern: ['ME', 'DEAF'], text: { en: 'I am Deaf.', sn: 'Ndiri matsi.', nd: 'Ngiyisacuthe.' } },
  { id: 'me-sick', pattern: ['ME', 'SICK'], text: { en: 'I am sick.', sn: 'Ndiri kurwara.', nd: 'Ngiyagula.' } },
  { id: 'not-understand', pattern: ['ME', 'UNDERSTAND', 'NO'], text: { en: "I don't understand.", sn: 'Handinzwisise.', nd: 'Angizwisisi.' } },
  { id: 'call-police', pattern: ['POLICE', 'HELP'], text: { en: 'Call the police!', sn: 'Daidzai mapurisa!', nd: 'Biza amapholisa!' } },
  { id: 'me-fine', pattern: ['ME', 'GOOD'], text: { en: 'I am fine.', sn: 'Ndiripo.', nd: 'Ngikhona.' } },
];

function buildSigns(): SignEntry[] {
  const signs: SignEntry[] = ROWS.map(([gloss, category, , , , descriptor]) => ({
    id: gloss,
    gloss,
    region: 'common',
    category,
    descriptor,
    mediaUri: null,
    reviewed: false,
  }));
  for (const [gloss, region, descriptor] of REGIONAL_VARIANTS) {
    const base = signs.find((s) => s.gloss === gloss);
    if (base && base.region === 'common') base.region = 'harare';
    signs.push({
      id: `${gloss}~${region === 'bulawayo' ? 'BYO' : 'HRE'}`,
      gloss,
      region,
      category: base?.category ?? 'misc',
      descriptor,
      mediaUri: null,
      reviewed: false,
    });
  }
  return signs;
}

function buildTranslations(): TranslationEntry[] {
  const out: TranslationEntry[] = [];
  for (const [gloss, , en, sn, nd, , aliases] of ROWS) {
    out.push({ gloss, lang: 'en', text: en, aliases: aliases?.en ?? [] });
    out.push({ gloss, lang: 'sn', text: sn, aliases: aliases?.sn ?? [] });
    out.push({ gloss, lang: 'nd', text: nd, aliases: aliases?.nd ?? [] });
  }
  return out;
}

export const SEED_SIGNS: SignEntry[] = buildSigns();
export const SEED_TRANSLATIONS: TranslationEntry[] = buildTranslations();

export const SEED_DATA: DictionaryData = {
  signs: SEED_SIGNS,
  translations: SEED_TRANSLATIONS,
  phrases: SEED_PHRASES,
};

export function seedKeyframes(sign: SignEntry): Keyframe[] {
  return generateKeyframes(sign.descriptor);
}
