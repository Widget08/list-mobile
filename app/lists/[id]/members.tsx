import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useMembers, useUpdateMemberRole, useRemoveMember } from '@/hooks/useMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useList } from '@/hooks/useLists';
import type { ListMember, ListMemberRole } from '@/types/database';

const ROLE_COLORS: Record<ListMemberRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  edit: 'bg-blue-100 text-blue-700',
  view: 'bg-gray-100 text-gray-600',
};

function MemberRow({
  member,
  isOwner,
  canManage,
  onChangeRole,
  onRemove,
}: {
  member: ListMember;
  isOwner: boolean;
  canManage: boolean;
  onChangeRole: () => void;
  onRemove: () => void;
}) {
  const name = member.user_profiles?.username ?? member.user_profiles?.email ?? 'User';
  const roleClass = ROLE_COLORS[member.role];

  return (
    <View className="bg-white mx-4 mb-2 rounded-xl p-4 flex-row items-center justify-between border border-gray-100">
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{name}</Text>
        {member.user_profiles?.email && member.user_profiles?.username && (
          <Text className="text-xs text-gray-500">{member.user_profiles.email}</Text>
        )}
      </View>

      <View className="flex-row items-center gap-2">
        {canManage && !isOwner ? (
          <TouchableOpacity
            className={`px-2.5 py-1 rounded-full ${roleClass.split(' ')[0]}`}
            onPress={onChangeRole}
          >
            <Text className={`text-xs font-semibold ${roleClass.split(' ')[1]}`}>
              {member.role}
            </Text>
          </TouchableOpacity>
        ) : (
          <View className={`px-2.5 py-1 rounded-full ${roleClass.split(' ')[0]}`}>
            <Text className={`text-xs font-semibold ${roleClass.split(' ')[1]}`}>
              {isOwner ? 'owner' : member.role}
            </Text>
          </View>
        )}

        {canManage && !isOwner && (
          <TouchableOpacity onPress={onRemove}>
            <Text className="text-red-400 text-sm">Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: list } = useList(id);
  const { data: members } = useMembers(id);
  const { mutate: updateRole } = useUpdateMemberRole(id);
  const { mutate: removeMember } = useRemoveMember(id);

  const isOwner = list?.user_id === user?.id;

  const handleChangeRole = (member: ListMember) => {
    const roles: ListMemberRole[] = ['view', 'edit', 'admin'];
    Alert.alert('Change Role', `Change role for ${member.user_profiles?.username ?? 'this member'}`, [
      ...roles.map((role) => ({
        text: role.charAt(0).toUpperCase() + role.slice(1),
        onPress: () => updateRole({ memberId: member.id, role }),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemove = (member: ListMember) => {
    Alert.alert(
      'Remove member',
      `Remove ${member.user_profiles?.username ?? 'this member'} from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember(member.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">{members?.length ?? 0} members</Text>
        {isOwner && (
          <TouchableOpacity
            className="flex-row items-center gap-1"
            onPress={() => router.push(`/lists/${id}/invite` as any)}
          >
            <UserPlus size={18} color="#6366F1" />
            <Text className="text-brand font-semibold text-sm">Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        renderItem={({ item: member }) => (
          <MemberRow
            member={member}
            isOwner={member.user_id === list?.user_id}
            canManage={isOwner}
            onChangeRole={() => handleChangeRole(member)}
            onRemove={() => handleRemove(member)}
          />
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
