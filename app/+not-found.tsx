import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-xl font-bold text-gray-900">Page not found</Text>
        <Link href="/(tabs)" className="mt-4 text-brand">
          Go to home
        </Link>
      </View>
    </>
  );
}
