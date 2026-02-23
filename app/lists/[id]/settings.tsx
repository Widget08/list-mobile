import { useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { useListSettings, useUpdateListSettings, useListStatuses, useCreateStatus, useDeleteStatus } from '@/hooks/useListSettings';
import type { SortBy } from '@/types/database';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'manual', label: 'Custom order' },
  { value: 'votes', label: 'Most votes' },
  { value: 'ratings', label: 'Highest rated' },
  { value: 'shuffle', label: 'Shuffle' },
];

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-50">
      <Text className="text-base text-gray-800">{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
        thumbColor="white"
      />
    </View>
  );
}

export default function ListSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: settings } = useListSettings(id);
  const { mutate: updateSettings } = useUpdateListSettings(id);
  const { data: statuses } = useListStatuses(id);
  const { mutateAsync: createStatus } = useCreateStatus(id);
  const { mutate: deleteStatus } = useDeleteStatus(id);
  const [newStatus, setNewStatus] = useState('');
  const [addingStatus, setAddingStatus] = useState(false);

  type BoolSettingKey = keyof Pick<
    NonNullable<typeof settings>,
    | 'enable_voting'
    | 'enable_downvote'
    | 'enable_rating'
    | 'enable_comments'
    | 'enable_status'
    | 'enable_shuffle'
    | 'enable_ordering'
    | 'allow_multiple_tags'
  >;

  const toggle = (key: BoolSettingKey) => {
    if (!settings) return;
    updateSettings({ [key]: !settings[key] } as any);
  };

  const handleAddStatus = async () => {
    if (!newStatus.trim()) return;
    setAddingStatus(true);
    try {
      await createStatus(newStatus.trim());
      setNewStatus('');
    } finally {
      setAddingStatus(false);
    }
  };

  if (!settings) return null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Features */}
        <View className="bg-white rounded-2xl px-4 mb-4 border border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-3 pb-1">
            Features
          </Text>
          <ToggleRow label="Voting" value={settings.enable_voting} onToggle={() => toggle('enable_voting')} />
          <ToggleRow label="Downvoting" value={settings.enable_downvote} onToggle={() => toggle('enable_downvote')} />
          <ToggleRow label="Ratings" value={settings.enable_rating} onToggle={() => toggle('enable_rating')} />
          <ToggleRow label="Comments" value={settings.enable_comments} onToggle={() => toggle('enable_comments')} />
          <ToggleRow label="Item Status" value={settings.enable_status} onToggle={() => toggle('enable_status')} />
          <ToggleRow label="Shuffle" value={settings.enable_shuffle} onToggle={() => toggle('enable_shuffle')} />
          <ToggleRow label="Manual Ordering" value={settings.enable_ordering} onToggle={() => toggle('enable_ordering')} />
          <ToggleRow label="Multiple Tags" value={settings.allow_multiple_tags} onToggle={() => toggle('allow_multiple_tags')} />
        </View>

        {/* Default sort */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Default Sort
          </Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              className="flex-row items-center justify-between py-2.5"
              onPress={() => updateSettings({ sort_by: opt.value })}
            >
              <Text className="text-base text-gray-800">{opt.label}</Text>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  settings.sort_by === opt.value ? 'border-brand' : 'border-gray-300'
                }`}
              >
                {settings.sort_by === opt.value && (
                  <View className="w-2.5 h-2.5 rounded-full bg-brand" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom statuses */}
        {settings.enable_status && (
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Custom Statuses
            </Text>

            {statuses?.map((s) => (
              <View key={s.id} className="flex-row items-center justify-between py-2 border-b border-gray-50">
                <Text className="text-gray-800">{s.name}</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Delete status', `Remove "${s.name}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteStatus(s.id) },
                    ])
                  }
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View className="flex-row items-center gap-2 mt-3">
              <TextInput
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 bg-gray-50"
                placeholder="Add status…"
                placeholderTextColor="#9CA3AF"
                value={newStatus}
                onChangeText={setNewStatus}
                onSubmitEditing={handleAddStatus}
              />
              <TouchableOpacity
                className="bg-brand w-9 h-9 rounded-xl items-center justify-center"
                onPress={handleAddStatus}
                disabled={addingStatus || !newStatus.trim()}
              >
                <Plus size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
