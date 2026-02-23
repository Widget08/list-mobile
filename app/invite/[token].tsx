import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useRedeemInvite } from '@/hooks/useInviteLinks';

export default function InviteRedeemScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const { mutateAsync: redeemInvite } = useRedeemInvite();
  const [status, setStatus] = useState<'idle' | 'redeeming' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      // Not signed in — send to sign-in with token preserved in URL
      router.replace(`/(auth)/sign-in?inviteToken=${token}` as any);
      return;
    }

    if (status === 'idle') {
      handleRedeem();
    }
  }, [session, authLoading]);

  const handleRedeem = async () => {
    if (!token) return;
    setStatus('redeeming');
    try {
      const { listId } = await redeemInvite(token);
      setStatus('done');
      setTimeout(() => router.replace(`/lists/${listId}` as any), 800);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
      {status === 'redeeming' || status === 'idle' ? (
        <>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-gray-500 text-base">Joining list…</Text>
        </>
      ) : status === 'done' ? (
        <>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Joined!</Text>
          <Text className="text-gray-500">Taking you to the list…</Text>
        </>
      ) : (
        <>
          <Text className="text-xl font-bold text-gray-900 mb-2">Couldn't join</Text>
          <Text className="text-gray-500 text-center mb-6">{errorMsg}</Text>
          <TouchableOpacity
            className="bg-brand px-6 py-3 rounded-xl"
            onPress={() => router.replace('/(tabs)')}
          >
            <Text className="text-white font-semibold">Go to home</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}
