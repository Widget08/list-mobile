import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error && error.message !== 'Google sign-in was cancelled or failed') {
      Alert.alert('Google sign-in failed', error.message);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Please enter your email address first.');
      return;
    }
    setLoading(true);
    const { error } = await sendMagicLink(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  if (magicLinkSent) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Check your email</Text>
        <Text className="text-center text-gray-500 mb-6">
          We sent a magic link to{'\n'}
          <Text className="font-semibold text-gray-800">{email}</Text>
        </Text>
        <TouchableOpacity onPress={() => setMagicLinkSent(false)}>
          <Text className="text-brand font-semibold">Back to sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center p-6">
          <Text className="text-3xl font-bold text-gray-900 mb-1">Welcome back</Text>
          <Text className="text-gray-500 mb-8">Sign in to your account</Text>

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-900 bg-gray-50"
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-2 text-gray-900 bg-gray-50"
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />

          <Link href="/(auth)/forgot-password" className="text-brand text-sm text-right mb-6">
            Forgot password?
          </Link>

          <TouchableOpacity
            className="bg-brand rounded-xl py-3.5 items-center mb-3"
            onPress={handleEmailSignIn}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Signing in…' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-gray-200 rounded-xl py-3.5 items-center mb-3"
            onPress={handleMagicLink}
            disabled={loading}
          >
            <Text className="text-gray-700 font-semibold text-base">Send magic link</Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400 text-sm">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <TouchableOpacity
            className="border border-gray-200 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text className="text-gray-700 font-semibold text-base">Continue with Google</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Don't have an account? </Text>
            <Link href="/(auth)/sign-up" className="text-brand font-semibold">
              Sign up
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
