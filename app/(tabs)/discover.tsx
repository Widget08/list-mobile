import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePublicLists } from '@/hooks/useLists';
import { useQueryClient } from '@tanstack/react-query';
import { listKeys } from '@/hooks/useLists';
import type { List } from '@/types/database';

function PublicListCard({ list, onPress }: { list: List; onPress: () => void }) {
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
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: lists, isLoading } = usePublicLists();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Discover</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Public lists from the community</Text>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PublicListCard list={item} onPress={() => router.push(`/lists/${item.id}` as any)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => qc.invalidateQueries({ queryKey: listKeys.public() })}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-400 text-base">No public lists yet</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
