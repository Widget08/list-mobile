import '../global.css';
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { queryClient } from '@/lib/queryClient';
import { useSharedUrl } from '@/hooks/useSharedUrl';
import { ShareIntentModal } from '@/components/lists/ShareIntentModal';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { sharedUrl, clearSharedUrl } = useSharedUrl();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inInviteGroup = segments[0] === 'invite';

    if (!session && !inAuthGroup && !inInviteGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return (
    <>
      {children}
      {/* Android share intent: show list picker when a URL is shared into the app */}
      {sharedUrl && session && (
        <ShareIntentModal url={sharedUrl} onDismiss={clearSharedUrl} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="lists" />
              <Stack.Screen
                name="invite/[token]"
                options={{ presentation: 'modal', headerShown: true, title: 'Join List' }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
