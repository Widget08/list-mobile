import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Plus, Settings, Users, Share2, ThumbsUp, ThumbsDown, Star, MessageCircle } from 'lucide-react-native';
import { useList } from '@/hooks/useLists';
import { useListItems } from '@/hooks/useListItems';
import { useListSettings } from '@/hooks/useListSettings';
import { useVoteItem, useRateItem } from '@/hooks/useVotesAndRatings';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { ListItem } from '@/types/database';
import type { SortBy } from '@/types/database';

function VoteButtons({
  item,
  enableDownvote,
  onVote,
}: {
  item: ListItem;
  enableDownvote: boolean;
  onVote: (voteType: 1 | -1 | null) => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={() => onVote(item.myVote === 1 ? null : 1)}
        className="flex-row items-center gap-1"
      >
        <ThumbsUp size={16} color={item.myVote === 1 ? '#6366F1' : '#9CA3AF'} />
        <Text className={`text-sm ${item.myVote === 1 ? 'text-brand font-semibold' : 'text-gray-400'}`}>
          {item.upvotes}
        </Text>
      </TouchableOpacity>
      {enableDownvote && (
        <TouchableOpacity onPress={() => onVote(item.myVote === -1 ? null : -1)}>
          <ThumbsDown size={16} color={item.myVote === -1 ? '#EF4444' : '#9CA3AF'} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function StarRating({
  current,
  onRate,
}: {
  current: number | null;
  onRate: (rating: number) => void;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate(star)}>
          <Star
            size={14}
            color={(current ?? 0) >= star ? '#FBBF24' : '#D1D5DB'}
            fill={(current ?? 0) >= star ? '#FBBF24' : 'none'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ListItemRow({
  item,
  settings,
  onPress,
  onVote,
  onRate,
}: {
  item: ListItem;
  settings: any;
  onPress: () => void;
  onVote: (voteType: 1 | -1 | null) => void;
  onRate: (rating: number) => void;
}) {
  return (
    <TouchableOpacity
      className="bg-white mx-4 mb-2 rounded-xl p-4 border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className="text-base font-medium text-gray-900" numberOfLines={2}>
        {item.title}
      </Text>

      {item.status && settings?.enable_status && (
        <Text className="text-xs text-gray-500 mt-1">{item.status}</Text>
      )}

      {item.tags?.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-2">
          {item.tags.map((tag) => (
            <View key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-gray-600">{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center gap-4 mt-3">
        {settings?.enable_voting && (
          <VoteButtons item={item} enableDownvote={!!settings?.enable_downvote} onVote={onVote} />
        )}
        {settings?.enable_rating && (
          <StarRating current={item.myRating ?? null} onRate={onRate} />
        )}
        {settings?.enable_comments && item.commentCount != null && item.commentCount > 0 && (
          <View className="flex-row items-center gap-1">
            <MessageCircle size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">{item.commentCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const SORT_LABELS: Record<SortBy, string> = {
  manual: 'Custom',
  votes: 'Top Voted',
  ratings: 'Top Rated',
  shuffle: 'Shuffle',
};

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: list } = useList(id);
  const { data: settings } = useListSettings(id);
  const [sortBy, setSortBy] = useState<SortBy>('manual');
  const { data: items, isLoading, refetch } = useListItems(id, sortBy);
  const { mutate: voteItem } = useVoteItem(id);
  const { mutate: rateItem } = useRateItem(id);

  useEffect(() => {
    if (settings?.sort_by) setSortBy(settings.sort_by);
  }, [settings?.sort_by]);

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`list-items:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ['list-items', id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: list?.name ?? 'List',
          headerRight: () => (
            <View className="flex-row gap-4 mr-2">
              <TouchableOpacity onPress={() => router.push(`/lists/${id}/members` as any)}>
                <Users size={22} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/lists/${id}/settings` as any)}>
                <Settings size={22} color="#374151" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Sort controls */}
      {settings?.enable_ordering || settings?.enable_shuffle || settings?.enable_voting || settings?.enable_rating ? (
        <View className="flex-row gap-2 px-4 py-2">
          {(['manual', 'votes', 'ratings', 'shuffle'] as SortBy[])
            .filter(
              (s) =>
                s === 'manual' ||
                (s === 'votes' && settings?.enable_voting) ||
                (s === 'ratings' && settings?.enable_rating) ||
                (s === 'shuffle' && settings?.enable_shuffle)
            )
            .map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSortBy(s)}
                className={`px-3 py-1 rounded-full ${sortBy === s ? 'bg-brand' : 'bg-gray-200'}`}
              >
                <Text className={`text-xs font-medium ${sortBy === s ? 'text-white' : 'text-gray-600'}`}>
                  {SORT_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListItemRow
            item={item}
            settings={settings}
            onPress={() => router.push(`/lists/${id}/item/${item.id}` as any)}
            onVote={(voteType) => voteItem({ itemId: item.id, voteType })}
            onRate={(rating) => rateItem({ itemId: item.id, rating })}
          />
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-16">
              <Text className="text-gray-400 text-base">No items yet</Text>
              <TouchableOpacity
                className="mt-4 bg-brand px-5 py-2 rounded-xl"
                onPress={() => router.push(`/lists/${id}/item/new` as any)}
              >
                <Text className="text-white font-semibold">Add first item</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      />

      {/* Share FAB */}
      <TouchableOpacity
        className="absolute bottom-28 right-6 bg-white w-12 h-12 rounded-full items-center justify-center shadow border border-gray-200"
        onPress={() => router.push(`/lists/${id}/invite` as any)}
      >
        <Share2 size={20} color="#6366F1" />
      </TouchableOpacity>

      {/* Add item FAB */}
      <TouchableOpacity
        className="absolute bottom-12 right-6 bg-brand w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push(`/lists/${id}/item/new` as any)}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
