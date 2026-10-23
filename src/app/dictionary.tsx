import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SignPlayer } from '../components/SignPlayer';
import { useDictionary } from '../state/DictionaryContext';
import { useSettings } from '../state/SettingsContext';
import { normalizeText } from '../translation/dictionary';
import { buildSignSequence } from '../translation/signSequence';
import { LANGS } from '../types';

export default function DictionaryScreen() {
  const { theme, t, settings } = useSettings();
  const { dictionary, keyframes } = useDictionary();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = normalizeText(query);
    return dictionary.allGlosses().filter((g) => {
      if (!q) return true;
      if (g.toLowerCase().includes(q)) return true;
      return LANGS.some((l) => normalizeText(dictionary.text(g, l) ?? '').includes(q));
    });
  }, [dictionary, query]);

  const sequence = useMemo(
    () => buildSignSequence(dictionary, keyframes, selected ? [selected] : [], settings.region),
    [dictionary, keyframes, selected, settings.region],
  );

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg }]}>
      {selected && <SignPlayer sequence={sequence} avatarSize={150} />}
      <View style={[styles.search, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search')}
          placeholderTextColor={theme.textMuted}
          style={{ flex: 1, color: theme.text, fontSize: 17 * theme.scale, minHeight: 48 }}
        />
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 12 * theme.scale }}>⚠ {t('unreviewed')}</Text>
      <FlatList
        data={rows}
        keyExtractor={(g) => g}
        initialNumToRender={12}
        renderItem={({ item }) => {
          const variants = dictionary.variants(item).length;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              style={[styles.row, { borderColor: selected === item ? theme.accent : theme.border, backgroundColor: theme.surface }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 * theme.scale }}>{item}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 14 * theme.scale }}>
                  {LANGS.map((l) => dictionary.text(item, l)).join('  ·  ')}
                </Text>
              </View>
              {variants > 1 && <Ionicons name="git-branch" size={18} color={theme.accent} accessibilityLabel="Regional variants" />}
              <Ionicons name="play-circle" size={30} color={theme.accent} />
            </Pressable>
          );
        }}
        contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12 },
});
