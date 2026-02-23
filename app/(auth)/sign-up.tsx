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
import { Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpScreen() {
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, username);
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Check your email</Text>
        <Text className="text-center text-gray-500 mb-6">
          We sent a confirmation link to{'\n'}
          <Text className="font-semibold text-gray-800">{email}</Text>
        </Text>
        <Link href="/(auth)/sign-in" className="text-brand font-semibold">
          Back to sign in
        </Link>
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
          <Text className="text-3xl font-bold text-gray-900 mb-1">Create account</Text>
          <Text className="text-gray-500 mb-8">Start managing your lists</Text>

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-900 bg-gray-50"
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
          />

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
            className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-900 bg-gray-50"
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TouchableOpacity
            className="bg-brand rounded-xl py-3.5 items-center mb-4"
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Creating account…' : 'Create account'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-2">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/sign-in" className="text-brand font-semibold">
              Sign in
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
