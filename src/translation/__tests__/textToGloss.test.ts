import { textToGlosses } from '../textToGloss';
import { dict } from './helpers';

describe('textToGlosses', () => {
  const d = dict();

  it('maps English sentences and drops function words', () => {
    expect(textToGlosses(d, 'Where is the hospital?', 'en').glosses).toEqual(['WHERE', 'HOSPITAL']);
  });

  it('matches multi-word surface forms first', () => {
    expect(textToGlosses(d, 'Thank you', 'en').glosses).toEqual(['THANK-YOU']);
    expect(textToGlosses(d, 'Ndine urombo', 'sn').glosses).toEqual(['SORRY']);
  });

  it('maps whole phrase templates back to glosses', () => {
    expect(textToGlosses(d, 'Chipatara chiri kupi?', 'sn').glosses).toEqual(['WHERE', 'HOSPITAL']);
    expect(textToGlosses(d, 'Sawubona, unjani?', 'nd').glosses).toEqual(['HELLO', 'HOW', 'YOU']);
  });

  it('uses aliases (verb forms) in Shona and Ndebele', () => {
    expect(textToGlosses(d, 'Ndinoda mvura', 'sn').glosses).toEqual(['ME', 'WANT', 'WATER']);
    expect(textToGlosses(d, 'Ngifuna amanzi', 'nd').glosses).toEqual(['ME', 'WANT', 'WATER']);
  });

  it('fingerspells unknown words such as names', () => {
    const r = textToGlosses(d, 'My name is Rudo', 'en');
    expect(r.glosses).toEqual(['ME', 'NAME', 'FS:R', 'FS:U', 'FS:D', 'FS:O']);
    expect(r.fingerspelled).toEqual(['rudo']);
  });
});
