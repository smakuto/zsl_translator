import { useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSettings } from '../state/SettingsContext';

/** Dependency-free scrub bar with large touch target and clip markers. */
export function Scrubber({
  value,
  max,
  markers,
  onSeek,
  onScrubStart,
}: {
  value: number;
  max: number;
  markers: number[];
  onSeek: (v: number) => void;
  onScrubStart?: () => void;
}) {
  const { theme } = useSettings();
  const [width, setWidth] = useState(1);
  const pct = max > 0 ? value / max : 0;
  const handle = (e: GestureResponderEvent) => onSeek((Math.max(0, Math.min(width, e.nativeEvent.locationX)) / width) * max);
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Scrub"
      accessibilityValue={{ min: 0, max, now: value }}
      onAccessibilityAction={(e) => onSeek(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width || 1)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        onScrubStart?.();
        handle(e);
      }}
      onResponderMove={handle}
      style={styles.hit}
    >
      <View pointerEvents="none" style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: theme.accent }]} />
        {markers.map((m) => (
          <View key={m} style={[styles.marker, { left: `${max > 0 ? (m / max) * 100 : 0}%`, backgroundColor: theme.textMuted }]} />
        ))}
      </View>
      <View pointerEvents="none" style={[styles.thumb, { left: pct * width - 12, backgroundColor: theme.accent, borderColor: theme.bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8 },
  marker: { position: 'absolute', width: 2, height: 8 },
  thumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 3 },
});
