import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createGestureRecognizer } from '../engines/gesture';
import { speak, VoiceChoice } from '../engines/speech/tts';
import { useDictionary } from '../state/DictionaryContext';
import { useSettings } from '../state/SettingsContext';
import { GestureStreamParser } from '../translation/gestureParser';
import { glossesToText } from '../translation/glossToText';
import { GesturePrediction, LANG_LABEL, LANGS, NO_SIGN } from '../types';
import { BigButton, Card, GlossChips, Pills } from './ui';

/** Feature A — Sign Language → Speech, fully on-device. */
export function CameraPanel() {
  const { theme, t, settings, update } = useSettings();
  const { dictionary } = useDictionary();
  const [permission, requestPermission] = useCameraPermissions();
  const recognizer = useMemo(() => createGestureRecognizer(), []);
  const parser = useMemo(() => new GestureStreamParser(dictionary), [dictionary]);

  const [running, setRunning] = useState(false);
  const [live, setLive] = useState<GesturePrediction | null>(null);
  const [fps, setFps] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);
  const [sentence, setSentence] = useState<string[]>([]);
  const [voice, setVoice] = useState<VoiceChoice | null>(null);
  const frameTimes = useRef<number[]>([]);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const translation = useMemo(() => glossesToText(dictionary, sentence, settings.outputLang), [dictionary, sentence, settings.outputLang]);

  const say = useCallback(async (text: string) => {
    if (!text) return;
    setVoice(await speak(text, settingsRef.current.outputLang));
  }, []);

  const onPrediction = useCallback(
    (p: GesturePrediction) => {
      const now = Date.now();
      const times = frameTimes.current;
      times.push(now);
      while (times.length && now - times[0] > 1000) times.shift();
      setFps(times.length);
      setLive(p);
      for (const e of parser.push(p)) {
        if (e.type === 'token') setTokens(e.tokens);
        else {
          setTokens([]);
          setSentence(e.tokens);
          if (settingsRef.current.autoSpeak) say(glossesToText(dictionary, e.tokens, settingsRef.current.outputLang).text);
        }
      }
    },
    [parser, dictionary, say],
  );

  useEffect(() => {
    if (!running) return;
    recognizer.start(onPrediction);
    return () => recognizer.stop();
  }, [running, recognizer, onPrediction]);

  const finish = () => {
    const e = parser.flush();
    if (e?.type === 'sentence') {
      setSentence(e.tokens);
      setTokens([]);
      say(glossesToText(dictionary, e.tokens, settings.outputLang).text);
    }
  };

  const clear = () => {
    parser.reset();
    setTokens([]);
    setSentence([]);
  };

  const liveLabel = live && live.label !== NO_SIGN ? live.label : '—';

  return (
    <View style={styles.wrap}>
      <View style={[styles.cameraBox, { borderColor: running ? theme.accent : theme.border, backgroundColor: theme.surface }]}>
        {permission?.granted ? (
          <CameraView style={StyleSheet.absoluteFill} facing="front" mute animateShutter={false} />
        ) : (
          <View style={styles.permission}>
            <Ionicons name="videocam-off" size={48} color={theme.textMuted} />
            <Text style={[styles.permText, { color: theme.text, fontSize: 15 * theme.scale }]}>{t('cameraPermission')}</Text>
            <BigButton icon="checkmark-circle" label={t('allow')} onPress={requestPermission} style={{ flex: 0, alignSelf: 'stretch' }} />
          </View>
        )}
        <View style={styles.overlayTop} pointerEvents="none">
          <View style={[styles.tag, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
            <Text style={styles.tagText}>{running ? `${fps} FPS` : 'II'}</Text>
          </View>
          {recognizer.info.isMock && (
            <View style={[styles.tag, { backgroundColor: 'rgba(255,212,0,0.9)' }]}>
              <Text style={[styles.tagText, { color: '#000' }]}>{t('demoEngine')}</Text>
            </View>
          )}
        </View>
        {running && (
          <View style={styles.overlayBottom} pointerEvents="none">
            <Text style={styles.liveLabel} numberOfLines={1}>
              {liveLabel}
            </Text>
            <View style={styles.confTrack}>
              <View style={[styles.confFill, { width: `${Math.round((live?.confidence ?? 0) * 100)}%`, backgroundColor: theme.accent }]} />
            </View>
          </View>
        )}
      </View>

      <Card style={{ gap: 8 }}>
        <View style={styles.row}>
          <Ionicons name="volume-high" size={22} color={theme.textMuted} accessibilityLabel={t('output')} />
          <Pills options={LANGS} value={settings.outputLang} onChange={(l) => update({ outputLang: l })} render={(l) => LANG_LABEL[l].short} />
        </View>
        <GlossChips glosses={tokens.length ? tokens : sentence} />
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.output, { color: translation.text ? theme.text : theme.textMuted, fontSize: 28 * theme.scale }]}
        >
          {translation.text || t('signHere')}
        </Text>
        {voice?.fallback && <Text style={{ color: theme.textMuted, fontSize: 12 * theme.scale }}>{t('ttsFallback')}</Text>}
      </Card>

      <View style={styles.row}>
        <BigButton
          icon={running ? 'stop-circle' : 'hand-left'}
          label={running ? t('stop') : t('start')}
          variant={running ? 'danger' : 'primary'}
          onPress={() => setRunning((r) => !r)}
        />
        <BigButton icon="checkmark-done" label={t('done')} variant="secondary" onPress={finish} disabled={!running} />
      </View>
      <View style={styles.row}>
        <BigButton icon="volume-high" label={t('speak')} variant="secondary" onPress={() => say(translation.text)} disabled={!translation.text} />
        <BigButton icon="trash" label={t('clear')} variant="secondary" onPress={clear} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  cameraBox: { height: 260, borderRadius: 22, overflow: 'hidden', borderWidth: 3 },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  permText: { textAlign: 'center', fontWeight: '600' },
  overlayTop: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between' },
  tag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.6)', gap: 6 },
  liveLabel: { color: '#fff', fontSize: 22, fontWeight: '900' },
  confTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  confFill: { height: 6 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  output: { fontWeight: '900', minHeight: 40 },
});
