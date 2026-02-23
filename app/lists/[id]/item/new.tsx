import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCreateItem } from '@/hooks/useListItems';
import { useListSettings, useListStatuses } from '@/hooks/useListSettings';
import { fetchUrlMetadata, isValidUrl } from '@/lib/utils';

export default function NewItemScreen() {
  const { id, prefillUrl } = useLocalSearchParams<{ id: string; prefillUrl?: string }>();
  const router = useRouter();
  const { mutateAsync: createItem } = useCreateItem(id);
  const { data: settings } = useListSettings(id);
  const { data: statuses } = useListStatuses(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState(prefillUrl ?? '');
  const [status, setStatus] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  useEffect(() => {
    if (prefillUrl && isValidUrl(prefillUrl)) {
      setUrl(prefillUrl);
      fetchMeta(prefillUrl);
    }
  }, [prefillUrl]);

  const fetchMeta = async (targetUrl: string) => {
    setFetchingMeta(true);
    const meta = await fetchUrlMetadata(targetUrl);
    if (meta.title) setTitle((prev) => prev || meta.title!);
    if (meta.description) setDescription((prev) => prev || meta.description!);
    setFetchingMeta(false);
  };

  const handleUrlBlur = async () => {
    if (url && isValidUrl(url) && !title) {
      fetchMeta(url);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for this item.');
      return;
    }
    setLoading(true);
    try {
      await createItem({
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        status: status || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Item' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-900 bg-gray-50 text-base"
            placeholder="Title *"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            autoFocus={!prefillUrl}
          />

          <View className="relative mb-3">
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="URL (optional)"
              placeholderTextColor="#9CA3AF"
              value={url}
              onChangeText={setUrl}
              onBlur={handleUrlBlur}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {fetchingMeta && (
              <ActivityIndicator
                size="small"
                color="#6366F1"
                style={{ position: 'absolute', right: 12, top: 14 }}
              />
            )}
          </View>

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-900 bg-gray-50"
            placeholder="Description (optional)"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {settings?.enable_status && statuses && statuses.length > 0 && (
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-500 mb-2">Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {statuses.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setStatus(status === s.name ? '' : s.name)}
                      className={`px-3 py-1.5 rounded-full border ${
                        status === s.name
                          ? 'bg-brand border-brand'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          status === s.name ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-900 bg-gray-50"
            placeholder="Tags (comma-separated)"
            placeholderTextColor="#9CA3AF"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
          />

          <TouchableOpacity
            className="bg-brand rounded-xl py-3.5 items-center"
            onPress={handleCreate}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Adding…' : 'Add item'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
