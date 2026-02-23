import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThumbsUp, ThumbsDown, Star, ExternalLink, Trash2, Send } from 'lucide-react-native';
import { useListItem } from '@/hooks/useListItems';
import { useListSettings } from '@/hooks/useListSettings';
import { useVoteItem, useRateItem } from '@/hooks/useVotesAndRatings';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeDate } from '@/lib/utils';
import type { ListItemComment } from '@/types/database';

export default function ItemDetailScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: item } = useListItem(itemId);
  const { data: settings } = useListSettings(id);
  const { data: comments } = useComments(itemId);
  const { mutate: voteItem } = useVoteItem(id);
  const { mutate: rateItem } = useRateItem(id);
  const { mutateAsync: addComment } = useAddComment(itemId);
  const { mutate: deleteComment } = useDeleteComment(itemId);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await addComment(commentText.trim());
      setCommentText('');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (comment: ListItemComment) => {
    if (comment.user_id !== user?.id) return;
    Alert.alert('Delete comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteComment(comment.id),
      },
    ]);
  };

  const renderHeader = () => (
    <View>
      {/* Item header */}
      <View className="bg-white p-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-2">{item?.title}</Text>

        {item?.description ? (
          <Text className="text-gray-600 mb-3">{item.description}</Text>
        ) : null}

        {item?.url ? (
          <TouchableOpacity
            className="flex-row items-center gap-1 mb-3"
            onPress={() => Linking.openURL(item.url!)}
          >
            <ExternalLink size={14} color="#6366F1" />
            <Text className="text-brand text-sm" numberOfLines={1}>
              {item.url}
            </Text>
          </TouchableOpacity>
        ) : null}

        {(item?.tags?.length ?? 0) > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-3">
            {(item?.tags ?? []).map((tag) => (
              <View key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-gray-600">{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View className="flex-row items-center gap-5 pt-2">
          {settings?.enable_voting && (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="flex-row items-center gap-1"
                onPress={() => voteItem({ itemId, voteType: item?.myVote === 1 ? null : 1 })}
              >
                <ThumbsUp size={20} color={item?.myVote === 1 ? '#6366F1' : '#9CA3AF'} />
                <Text className="text-sm text-gray-600">{item?.upvotes ?? 0}</Text>
              </TouchableOpacity>
              {settings?.enable_downvote && (
                <TouchableOpacity
                  onPress={() => voteItem({ itemId, voteType: item?.myVote === -1 ? null : -1 })}
                >
                  <ThumbsDown size={20} color={item?.myVote === -1 ? '#EF4444' : '#9CA3AF'} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {settings?.enable_rating && (
            <View className="flex-row gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => rateItem({ itemId, rating: star })}
                >
                  <Star
                    size={22}
                    color={(item?.myRating ?? 0) >= star ? '#FBBF24' : '#D1D5DB'}
                    fill={(item?.myRating ?? 0) >= star ? '#FBBF24' : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Comments header */}
      {settings?.enable_comments && (
        <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Comments ({comments?.length ?? 0})
        </Text>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: item?.title ?? 'Item' }} />
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <FlatList
            data={settings?.enable_comments ? (comments ?? []) : []}
            keyExtractor={(c) => c.id}
            ListHeaderComponent={renderHeader}
            renderItem={({ item: comment }) => (
              <TouchableOpacity
                className="bg-white mx-4 mb-2 rounded-xl p-3 border border-gray-100"
                onLongPress={() => handleDeleteComment(comment)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-semibold text-gray-700">
                    {comment.user_profiles?.username ?? comment.user_profiles?.email ?? 'User'}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {formatRelativeDate(comment.created_at)}
                  </Text>
                </View>
                <Text className="text-sm text-gray-800">{comment.comment}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
          />

          {settings?.enable_comments && (
            <View className="flex-row items-center gap-2 px-4 py-3 bg-white border-t border-gray-100">
              <TextInput
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-gray-900 border border-gray-200"
                placeholder="Write a comment…"
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSendComment}
                disabled={!commentText.trim() || sending}
                className="bg-brand w-10 h-10 rounded-full items-center justify-center"
              >
                <Send size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
