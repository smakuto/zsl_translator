import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { OfflineBadge } from '../components/OfflineBadge';
import { Card, Pills } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import { ThemeName } from '../theme/themes';
import { LANG_LABEL, LANGS, Region } from '../types';

function Section({ icon, title, children }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; children: ReactNode }) {
  const { theme } = useSettings();
  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.title}>
        <Ionicons name={icon} size={22} color={theme.accent} />
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 17 * theme.scale }}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

export default function SettingsScreen() {
  const { theme, t, settings, update } = useSettings();
  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.wrap}>
      <OfflineBadge />
      <Section icon="contrast" title={t('theme')}>
        <Pills<ThemeName>
          options={['dark', 'outdoor']}
          value={settings.theme}
          onChange={(v) => update({ theme: v })}
          render={(v) => (v === 'dark' ? `🌙 ${t('darkMode')}` : `☀️ ${t('outdoorMode')}`)}
        />
      </Section>
      <Section icon="language" title={t('uiLanguage')}>
        <Pills options={LANGS} value={settings.uiLang} onChange={(l) => update({ uiLang: l })} render={(l) => LANG_LABEL[l].native} />
      </Section>
      <Section icon="map" title={t('region')}>
        <Pills<Region>
          options={['harare', 'bulawayo']}
          value={settings.region}
          onChange={(r) => update({ region: r })}
          render={(r) => (r === 'harare' ? 'Harare' : 'Bulawayo')}
        />
      </Section>
      <Section icon="volume-high" title={t('speak')}>
        <View style={styles.title}>
          <Text style={{ color: theme.text, flex: 1, fontSize: 16 * theme.scale }}>{t('autoSpeak')}</Text>
          <Switch value={settings.autoSpeak} onValueChange={(v) => update({ autoSpeak: v })} />
        </View>
      </Section>
      <Section icon="cloud-offline" title={t('offlineActive')}>
        <Text style={{ color: theme.textMuted, fontSize: 14 * theme.scale }}>
          Sign recognition, translation, speech and the dictionary all run on this phone. No internet or data bundle is needed.
        </Text>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
