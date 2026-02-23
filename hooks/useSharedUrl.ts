import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * On Android, when the app is opened via a share intent (ACTION_SEND with text/plain),
 * the shared URL arrives as a query param in the initial URL.
 *
 * On iOS, the share extension writes to a shared App Group container
 * and the main app reads it on foreground. This hook handles the Android case.
 * iOS share extension requires expo-share-extension (native module, EAS Build only).
 */
export function useSharedUrl() {
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Check initial URL for shared content
    Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const text = parsed.queryParams?.text as string | undefined;
      if (text && text.startsWith('http')) {
        setSharedUrl(text);
      }
    });

    // Handle URLs received while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      const text = parsed.queryParams?.text as string | undefined;
      if (text && text.startsWith('http')) {
        setSharedUrl(text);
      }
    });

    return () => subscription.remove();
  }, []);

  const clearSharedUrl = () => setSharedUrl(null);

  return { sharedUrl, clearSharedUrl };
}
