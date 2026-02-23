import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Email sent</Text>
        <Text className="text-center text-gray-500 mb-6">
          Check your inbox for a link to reset your password.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
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
      <View className="flex-1 justify-center p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-1">Reset password</Text>
        <Text className="text-gray-500 mb-8">
          Enter your email and we'll send you a reset link.
        </Text>

        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-900 bg-gray-50"
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TouchableOpacity
          className="bg-brand rounded-xl py-3.5 items-center mb-4"
          onPress={handleReset}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? 'Sending…' : 'Send reset link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="items-center">
          <Text className="text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
