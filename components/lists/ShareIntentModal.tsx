import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useMyLists } from '@/hooks/useLists';
import { useCreateItem } from '@/hooks/useListItems';
import { fetchUrlMetadata, truncate } from '@/lib/utils';
import type { List } from '@/types/database';

interface Props {
  url: string;
  onDismiss: () => void;
}

/**
 * Modal shown when a URL is shared into the app from another app.
 * Lets the user pick a list and adds the URL as a new item.
 */
export function ShareIntentModal({ url, onDismiss }: Props) {
  const router = useRouter();
  const { data: myLists } = useMyLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { mutateAsync: createItem } = useCreateItem(selectedListId ?? '');

  const handleListSelect = async (list: List) => {
    setSelectedListId(list.id);
    setSaving(true);
    try {
      const meta = await fetchUrlMetadata(url);
      await createItem({
        title: meta.title ?? truncate(url, 80),
        description: meta.description,
        url,
        metadata: meta,
      });
      onDismiss();
      // Navigate to the list after a brief delay
      setTimeout(() => router.push(`/lists/${list.id}` as any), 300);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
      setSelectedListId(null);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onDismiss}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl pt-4 pb-8">
          {/* Handle */}
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />

          <View className="px-4 flex-row items-center justify-between mb-3">
            <View className="flex-1 mr-4">
              <Text className="text-base font-semibold text-gray-900">Add to a list</Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {url}
              </Text>
            </View>
            <TouchableOpacity onPress={onDismiss}>
              <X size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {saving ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#6366F1" />
              <Text className="text-gray-500 mt-2 text-sm">Adding to list…</Text>
            </View>
          ) : (
            <FlatList
              data={myLists}
              keyExtractor={(l) => l.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item: list }) => (
                <TouchableOpacity
                  className="px-4 py-3.5 border-b border-gray-50 flex-row items-center"
                  onPress={() => handleListSelect(list)}
                >
                  <View className="flex-1">
                    <Text className="text-base text-gray-900 font-medium">{list.name}</Text>
                    {list.description ? (
                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {list.description}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-center text-gray-400 py-8">No lists yet</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
