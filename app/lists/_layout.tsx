import { Stack } from 'expo-router';

export default function ListsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]/index"
        options={{ headerShown: true, title: '', headerBackTitle: 'Lists' }}
      />
      <Stack.Screen
        name="[id]/settings"
        options={{ headerShown: true, title: 'Settings', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="[id]/members"
        options={{ headerShown: true, title: 'Members', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="[id]/invite"
        options={{
          headerShown: true,
          title: 'Invite Link',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]/item/new"
        options={{
          headerShown: true,
          title: 'Add Item',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]/item/[itemId]"
        options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}
