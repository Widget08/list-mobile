import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, Share2, Trash2 } from 'lucide-react-native';
import { useInviteLinks, useCreateInviteLink, useDeleteInviteLink } from '@/hooks/useInviteLinks';
import type { ListMemberRole } from '@/types/database';

const ROLE_OPTIONS: { value: ListMemberRole; label: string; description: string }[] = [
  { value: 'view', label: 'View', description: 'Can view and vote/rate/comment' },
  { value: 'edit', label: 'Edit', description: 'Can add and edit items' },
  { value: 'admin', label: 'Admin', description: 'Full access including settings' },
];

const EXPIRY_OPTIONS = [
  { label: 'Never', hours: undefined },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
];

const MAX_USES_OPTIONS = [
  { label: 'Unlimited', value: undefined },
  { label: '1 use', value: 1 },
  { label: '5 uses', value: 5 },
  { label: '10 uses', value: 10 },
];

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: links } = useInviteLinks(id);
  const { mutateAsync: createLink } = useCreateInviteLink(id);
  const { mutate: deleteLink } = useDeleteInviteLink(id);

  const [role, setRole] = useState<ListMemberRole>('view');
  const [expiryIdx, setExpiryIdx] = useState(0);
  const [maxUsesIdx, setMaxUsesIdx] = useState(0);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createLink({
        role,
        expiresHours: EXPIRY_OPTIONS[expiryIdx].hours,
        maxUses: MAX_USES_OPTIONS[maxUsesIdx].value,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  };

  const getLinkUrl = (token: string) => `listapp://invite/${token}`;

  const handleCopy = async (token: string) => {
    await Clipboard.setStringAsync(getLinkUrl(token));
    Alert.alert('Copied', 'Invite link copied to clipboard');
  };

  const handleShare = (token: string) => {
    Share.share({
      message: `Join my list on List app: ${getLinkUrl(token)}`,
      url: getLinkUrl(token),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Create new link */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">Create invite link</Text>

          {/* Role */}
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Permission
          </Text>
          <View className="flex-row gap-2 mb-4">
            {ROLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`flex-1 py-2 rounded-xl border items-center ${
                  role === opt.value ? 'bg-brand border-brand' : 'bg-white border-gray-200'
                }`}
                onPress={() => setRole(opt.value)}
              >
                <Text
                  className={`text-sm font-semibold ${role === opt.value ? 'text-white' : 'text-gray-700'}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Expiry */}
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Expires
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {EXPIRY_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                className={`px-3 py-1.5 rounded-full border ${
                  expiryIdx === i ? 'bg-brand border-brand' : 'bg-white border-gray-200'
                }`}
                onPress={() => setExpiryIdx(i)}
              >
                <Text
                  className={`text-sm ${expiryIdx === i ? 'text-white font-semibold' : 'text-gray-700'}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Max uses */}
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Max Uses
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {MAX_USES_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                className={`px-3 py-1.5 rounded-full border ${
                  maxUsesIdx === i ? 'bg-brand border-brand' : 'bg-white border-gray-200'
                }`}
                onPress={() => setMaxUsesIdx(i)}
              >
                <Text
                  className={`text-sm ${maxUsesIdx === i ? 'text-white font-semibold' : 'text-gray-700'}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-brand rounded-xl py-3 items-center"
            onPress={handleCreate}
            disabled={creating}
          >
            <Text className="text-white font-semibold">
              {creating ? 'Creating…' : 'Generate link'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Existing links */}
        {links && links.length > 0 && (
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-3">Active Links</Text>
            {links.map((link) => (
              <View key={link.id} className="mb-4 pb-4 border-b border-gray-50 last:border-0 last:mb-0 last:pb-0">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-brand/10 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-semibold text-brand">{link.role}</Text>
                    </View>
                    {link.max_uses && (
                      <Text className="text-xs text-gray-400">
                        {link.used_count}/{link.max_uses} uses
                      </Text>
                    )}
                    {link.expires_at && (
                      <Text className="text-xs text-gray-400">
                        Expires {new Date(link.expires_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Delete link', 'Remove this invite link?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteLink(link.id),
                        },
                      ])
                    }
                  >
                    <Trash2 size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <Text className="text-xs text-gray-400 font-mono mb-2" numberOfLines={1}>
                  listapp://invite/{link.token.slice(0, 16)}…
                </Text>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1 border border-gray-200 rounded-xl py-2"
                    onPress={() => handleCopy(link.token)}
                  >
                    <Copy size={14} color="#6366F1" />
                    <Text className="text-brand text-sm font-medium">Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1 bg-brand rounded-xl py-2"
                    onPress={() => handleShare(link.token)}
                  >
                    <Share2 size={14} color="white" />
                    <Text className="text-white text-sm font-medium">Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
