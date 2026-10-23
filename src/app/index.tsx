import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraPanel } from '../components/CameraPanel';
import { MicPanel } from '../components/MicPanel';
import { Mode, ModeSwitch } from '../components/ModeSwitch';
import { OfflineBadge } from '../components/OfflineBadge';
import { IconButton } from '../components/ui';
import { useSettings } from '../state/SettingsContext';

export default function TranslatorScreen() {
  const { theme, t } = useSettings();
  const [mode, setMode] = useState<Mode>('camera');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.title, { color: theme.text, fontSize: 22 * theme.scale }]}>{t('appTitle')}</Text>
          <OfflineBadge />
        </View>
        <IconButton icon="book" label={t('dictionary')} onPress={() => router.push('/dictionary')} />
        <IconButton icon="settings" label={t('settings')} onPress={() => router.push('/settings')} />
      </View>
      <View style={styles.switch}>
        <ModeSwitch mode={mode} onChange={setMode} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {mode === 'camera' ? <CameraPanel /> : <MicPanel />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontWeight: '900' },
  switch: { paddingHorizontal: 16, paddingVertical: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
});
