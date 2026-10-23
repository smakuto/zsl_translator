import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PLAYBACK_SPEEDS, useSignPlayer } from '../hooks/useSignPlayer';
import { useSettings } from '../state/SettingsContext';
import { clipAt, SignSequence } from '../translation/signSequence';
import { restKeyframe } from '../translation/keyframes';
import { SignAvatar } from './SignAvatar';
import { Scrubber } from './Scrubber';
import { Card, GlossChips, IconButton, Pills } from './ui';

/** Avatar playback with play/pause, frame stepping, scrubbing and 0.5x/1x/1.5x speed. */
type Props = { sequence: SignSequence; avatarSize?: number };

const sequenceIds = new WeakMap<SignSequence, number>();
let nextSequenceId = 0;
function sequenceKey(sequence: SignSequence): number {
  let id = sequenceIds.get(sequence);
  if (id === undefined) {
    id = nextSequenceId++;
    sequenceIds.set(sequence, id);
  }
  return id;
}

export function SignPlayer(props: Props) {
  return <SignPlayerInner key={sequenceKey(props.sequence)} {...props} />;
}

function SignPlayerInner({ sequence, avatarSize = 220 }: Props) {
  const { theme, t } = useSettings();
  const total = sequence.frames.length;
  const player = useSignPlayer(total);
  const current = sequence.frames[player.frame] ?? restKeyframe();
  const clip = clipAt(sequence, player.frame);
  const activeIdx = clip ? sequence.clips.indexOf(clip) : -1;

  return (
    <Card style={styles.card}>
      <View style={styles.avatarRow}>
        <SignAvatar frame={current} fg={theme.text} bg={theme.surface} accent={theme.accent} size={avatarSize} />
      </View>
      <Text style={[styles.caption, { color: theme.text, fontSize: 24 * theme.scale }]} numberOfLines={1}>
        {clip?.label ?? (total ? ' ' : t('noSigns'))}
      </Text>
      <GlossChips glosses={sequence.clips.map((c) => c.gloss)} active={activeIdx} />
      <Scrubber
        value={player.frame}
        max={Math.max(0, total - 1)}
        markers={sequence.clips.map((c) => c.startFrame)}
        onSeek={player.seek}
        onScrubStart={() => player.setPlaying(false)}
      />
      <View style={styles.controls}>
        <IconButton icon="play-skip-back" label="Previous frame" onPress={() => player.step(-1)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={player.playing ? 'Pause' : 'Play'}
          onPress={player.toggle}
          style={[styles.play, { backgroundColor: theme.accent }]}
        >
          <Ionicons name={player.playing ? 'pause' : 'play'} size={34} color={theme.accentText} />
        </Pressable>
        <IconButton icon="play-skip-forward" label="Next frame" onPress={() => player.step(1)} />
        <View style={{ flex: 1 }} />
        <Text style={{ color: theme.textMuted, fontVariant: ['tabular-nums'], fontSize: 12 * theme.scale }}>
          {total ? `${player.frame + 1}/${total}` : '0/0'}
        </Text>
      </View>
      <View style={styles.speedRow}>
        <Ionicons name="speedometer" size={22} color={theme.textMuted} accessibilityLabel={t('speed')} />
        <Pills options={PLAYBACK_SPEEDS} value={player.speed} onChange={player.setSpeed} render={(s) => `${s}x`} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  avatarRow: { alignItems: 'center' },
  caption: { fontWeight: '900', textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  play: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
