import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../state/SettingsContext';

/**
 * Persistent reassurance that nothing uses mobile data. All recognition,
 * translation and speech run on-device; the app makes no network requests.
 */
export function OfflineBadge() {
  const { theme, t } = useSettings();
  return (
    <View
      accessible
      accessibilityLabel={`${t('offlineActive')}. ${t('noData')}`}
      style={[styles.badge, { borderColor: theme.success }]}
    >
      <Ionicons name="cloud-offline" size={18 * theme.scale} color={theme.success} />
      <Text style={[styles.text, { color: theme.success, fontSize: 13 * theme.scale }]}>{t('offlineActive')}</Text>
      <View style={[styles.dot, { backgroundColor: theme.success }]} />
      <Text style={[styles.sub, { color: theme.textMuted, fontSize: 12 * theme.scale }]}>{t('noData')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  text: { fontWeight: '800' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  sub: { fontWeight: '600' },
});
