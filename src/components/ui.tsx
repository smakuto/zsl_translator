import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSettings } from '../state/SettingsContext';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function BigButton({
  icon,
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  accessibilityHint,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}) {
  const { theme } = useSettings();
  const bg = variant === 'primary' ? theme.accent : variant === 'danger' ? theme.danger : theme.surfaceAlt;
  const fg = variant === 'secondary' ? theme.text : theme.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.big,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1, borderColor: theme.border },
        style,
      ]}
    >
      <Ionicons name={icon} size={28 * theme.scale} color={fg} />
      <Text style={[styles.bigLabel, { color: fg, fontSize: 18 * theme.scale }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  const { theme } = useSettings();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.icon,
        { backgroundColor: active ? theme.accent : theme.surfaceAlt, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={26 * theme.scale} color={active ? theme.accentText : theme.text} />
    </Pressable>
  );
}

export function Pills<T extends string | number>({
  options,
  value,
  onChange,
  render,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => string;
}) {
  const { theme } = useSettings();
  return (
    <View style={styles.pills} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={String(o)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o)}
            style={[
              styles.pill,
              { backgroundColor: active ? theme.accent : theme.surfaceAlt, borderColor: active ? theme.accent : theme.border },
            ]}
          >
            <Text style={{ color: active ? theme.accentText : theme.text, fontWeight: '800', fontSize: 16 * theme.scale }}>
              {render(o)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { theme } = useSettings();
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>{children}</View>;
}

export function GlossChips({ glosses, active }: { glosses: string[]; active?: number }) {
  const { theme } = useSettings();
  if (!glosses.length) return null;
  return (
    <View style={styles.chips}>
      {glosses.map((g, i) => (
        <View
          key={`${g}-${i}`}
          style={[styles.chip, { borderColor: i === active ? theme.accent : theme.border, backgroundColor: i === active ? theme.accent : 'transparent' }]}
        >
          <Text style={{ color: i === active ? theme.accentText : theme.text, fontWeight: '700', fontSize: 13 * theme.scale }}>
            {g.startsWith('FS:') ? `✋${g.slice(3)}` : g}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  big: {
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    flex: 1,
  },
  bigLabel: { fontWeight: '800' },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minWidth: 56, minHeight: 48, paddingHorizontal: 14, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  card: { borderRadius: 20, padding: 14, borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
});
