import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getSpeechRecognizer, SpeechRecognizer } from '../engines/speech';
import { useDictionary } from '../state/DictionaryContext';
import { useSettings } from '../state/SettingsContext';
import { buildSignSequence } from '../translation/signSequence';
import { textToGlosses } from '../translation/textToGloss';
import { LANG_LABEL, LANGS } from '../types';
import { SignPlayer } from './SignPlayer';
import { Card, Pills } from './ui';

/** Feature B — Speech/Text → ZSL avatar, fully on-device. */
export function MicPanel() {
  const { theme, t, settings, update } = useSettings();
  const { dictionary, keyframes } = useDictionary();
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [engine, setEngine] = useState<SpeechRecognizer | null>(null);
  const engineRef = useRef<SpeechRecognizer | null>(null);

  useEffect(() => {
    getSpeechRecognizer(settings.inputLang).then((e) => {
      engineRef.current = e;
      setEngine(e);
    });
    return () => engineRef.current?.stop();
  }, [settings.inputLang]);

  const glosses = useMemo(
    () => (submitted ? textToGlosses(dictionary, submitted, settings.inputLang).glosses : []),
    [dictionary, submitted, settings.inputLang],
  );
  const sequence = useMemo(
    () => buildSignSequence(dictionary, keyframes, glosses, settings.region),
    [dictionary, keyframes, glosses, settings.region],
  );

  const toggleMic = useCallback(async () => {
    const e = engineRef.current;
    if (!e) return;
    if (listening) {
      e.stop();
      setListening(false);
      return;
    }
    setPartial('');
    setListening(true);
    try {
      await e.start(
        settings.inputLang,
        {
          onPartial: setPartial,
          onFinal: (final) => {
            if (!final) return;
            setPartial('');
            setText(final);
            setSubmitted(final);
            setListening(false);
          },
          onError: () => setListening(false),
        },
        dictionary.vocabulary(settings.inputLang),
      );
    } catch {
      setListening(false);
    }
  }, [listening, settings.inputLang, dictionary]);

  return (
    <View style={styles.wrap}>
      <SignPlayer sequence={sequence} />

      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Ionicons name="mic" size={22} color={theme.textMuted} />
          <Pills options={LANGS} value={settings.inputLang} onChange={(l) => update({ inputLang: l })} render={(l) => LANG_LABEL[l].short} />
        </View>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listening ? t('stop') : t('tapToTalk')}
            onPress={toggleMic}
            style={[styles.mic, { backgroundColor: listening ? theme.danger : theme.accent }]}
          >
            <Ionicons name={listening ? 'stop' : 'mic'} size={40} color={theme.accentText} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 18 * theme.scale }}>
              {listening ? t('listening') : t('tapToTalk')}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 14 * theme.scale }} numberOfLines={2}>
              {partial || (engine?.isMock ? t('demoEngine') : engine?.label ?? '')}
            </Text>
          </View>
        </View>
        <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name="keypad" size={20} color={theme.textMuted} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => setSubmitted(text.trim())}
            placeholder={t('typeHere')}
            placeholderTextColor={theme.textMuted}
            returnKeyType="send"
            style={[styles.input, { color: theme.text, fontSize: 18 * theme.scale }]}
            accessibilityLabel={t('typeHere')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Translate"
            onPress={() => setSubmitted(text.trim())}
            style={[styles.send, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="arrow-forward" size={24} color={theme.accentText} />
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mic: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingLeft: 12 },
  input: { flex: 1, minHeight: 52 },
  send: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
