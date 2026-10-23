import { useSQLiteContext } from 'expo-sqlite';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { loadDictionary, LoadedDictionary } from '../db/database';

const DictionaryContext = createContext<LoadedDictionary | null>(null);

/** Loads the SQLite dictionary into memory once (≈50KB) for zero-latency lookups. */
export function DictionaryProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [loaded, setLoaded] = useState<LoadedDictionary | null>(null);

  useEffect(() => {
    let alive = true;
    loadDictionary(db).then((d) => alive && setLoaded(d));
    return () => {
      alive = false;
    };
  }, [db]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }
  return <DictionaryContext.Provider value={loaded}>{children}</DictionaryContext.Provider>;
}

export function useDictionary(): LoadedDictionary {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error('useDictionary must be used inside DictionaryProvider');
  return ctx;
}
