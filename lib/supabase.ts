import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// SecureStore has a ~2048-byte value limit per key. Supabase session tokens can
// exceed this, so we chunk large values across multiple keys.
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const chunks: string[] = [];
    let i = 0;
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
      if (chunk === null) break;
      chunks.push(chunk);
      i++;
    }
    return chunks.length > 0 ? chunks.join('') : null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const chunkSize = 1800;
    let i = 0;
    for (; i * chunkSize < value.length; i++) {
      await SecureStore.setItemAsync(
        `${key}.${i}`,
        value.slice(i * chunkSize, (i + 1) * chunkSize)
      );
    }
    // Remove any leftover chunks from a previous (longer) value
    while (true) {
      const stale = await SecureStore.getItemAsync(`${key}.${i}`);
      if (stale === null) break;
      await SecureStore.deleteItemAsync(`${key}.${i}`);
      i++;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    let i = 0;
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
      if (chunk === null) break;
      await SecureStore.deleteItemAsync(`${key}.${i}`);
      i++;
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required on React Native — no window.location
  },
});
