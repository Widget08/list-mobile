import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Mail } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-6">Profile</Text>

        {/* Account info */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="w-16 h-16 rounded-full bg-brand/10 items-center justify-center mb-3">
            <User size={32} color="#6366F1" />
          </View>
          <View className="flex-row items-center gap-2 mb-1">
            <Mail size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm">{user?.email}</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center justify-between"
          onPress={handleSignOut}
        >
          <Text className="text-red-500 font-semibold">Sign out</Text>
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
