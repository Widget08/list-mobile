import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMyLists, useSharedLists, useCreateList } from '@/hooks/useLists';
import { useQueryClient } from '@tanstack/react-query';
import { listKeys } from '@/hooks/useLists';
import type { List } from '@/types/database';

function ListCard({ list, onPress }: { list: List; onPress: () => void }) {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
        {list.name}
      </Text>
      {list.description ? (
        <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
          {list.description}
        </Text>
      ) : null}
      <View className="flex-row items-center mt-2 gap-2">
        <View
          className={`px-2 py-0.5 rounded-full ${
            list.public_access_mode === 'anyone'
              ? 'bg-green-100'
              : list.public_access_mode === 'members'
              ? 'bg-blue-100'
              : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              list.public_access_mode === 'anyone'
                ? 'text-green-700'
                : list.public_access_mode === 'members'
                ? 'text-blue-700'
                : 'text-gray-600'
            }`}
          >
            {list.public_access_mode === 'anyone'
              ? 'Public'
              : list.public_access_mode === 'members'
              ? 'Members'
              : 'Private'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: myLists, isLoading: myLoading } = useMyLists();
  const { data: sharedLists } = useSharedLists();
  const { mutateAsync: createList } = useCreateList();
  const [showNewList, setShowNewList] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const list = await createList({ name: newName.trim(), description: newDesc.trim() || undefined });
      setShowNewList(false);
      setNewName('');
      setNewDesc('');
      router.push(`/lists/${list.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  };

  const allItems: Array<{ type: 'header'; title: string } | { type: 'list'; data: List }> = [
    { type: 'header', title: 'My Lists' },
    ...(myLists ?? []).map((l) => ({ type: 'list' as const, data: l })),
    ...(sharedLists && sharedLists.length > 0
      ? [{ type: 'header' as const, title: 'Shared with Me' }, ...(sharedLists).map((l) => ({ type: 'list' as const, data: l! }))]
      : []),
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">Lists</Text>
      </View>

      <FlatList
        data={allItems}
        keyExtractor={(item, i) =>
          item.type === 'header' ? `header-${i}` : item.data.id
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {item.title}
              </Text>
            );
          }
          return (
            <ListCard
              list={item.data}
              onPress={() => router.push(`/lists/${item.data.id}` as any)}
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={myLoading}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: listKeys.mine() });
              qc.invalidateQueries({ queryKey: listKeys.shared() });
            }}
          />
        }
        ListEmptyComponent={
          !myLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-400 text-base">No lists yet</Text>
              <TouchableOpacity
                className="mt-4 bg-brand px-6 py-2.5 rounded-xl"
                onPress={() => setShowNewList(true)}
              >
                <Text className="text-white font-semibold">Create your first list</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 bg-brand w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowNewList(true)}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {/* New List Modal */}
      <Modal visible={showNewList} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowNewList(false)}
            activeOpacity={1}
          />
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">New List</Text>

            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-900 bg-gray-50"
              placeholder="List name"
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-900 bg-gray-50"
              placeholder="Description (optional)"
              placeholderTextColor="#9CA3AF"
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              className="bg-brand rounded-xl py-3.5 items-center"
              onPress={handleCreate}
              disabled={creating || !newName.trim()}
            >
              <Text className="text-white font-semibold text-base">
                {creating ? 'Creating…' : 'Create list'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
