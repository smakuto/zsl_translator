import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../state/SettingsContext';

export type Mode = 'camera' | 'mic';

/** One-tap switch between Sign→Speech (camera) and Speech→Sign (mic). */
export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { theme, t } = useSettings();
  const item = (m: Mode, icon: 'videocam' | 'mic', label: string) => {
    const active = mode === m;
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        onPress={() => {
          Haptics.selectionAsync().catch(() => undefined);
          onChange(m);
        }}
        style={[styles.item, { backgroundColor: active ? theme.accent : 'transparent' }]}
      >
        <Ionicons name={icon} size={30 * theme.scale} color={active ? theme.accentText : theme.text} />
        <Text style={{ color: active ? theme.accentText : theme.text, fontWeight: '800', fontSize: 14 * theme.scale }} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };
  return (
    <View accessibilityRole="tablist" style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {item('camera', 'videocam', t('cameraMode'))}
      {item('mic', 'mic', t('micMode'))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 22, padding: 4, borderWidth: 1 },
  item: { flex: 1, minHeight: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
