import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ListSettings, ListStatus } from '@/types/database';

export function useListSettings(listId: string) {
  return useQuery({
    queryKey: ['list-settings', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_settings')
        .select('*')
        .eq('list_id', listId)
        .single();
      if (error) throw error;
      return data as ListSettings;
    },
    enabled: !!listId,
  });
}

export function useUpdateListSettings(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Omit<ListSettings, 'id' | 'list_id'>>) => {
      const { error } = await supabase
        .from('list_settings')
        .update(updates)
        .eq('list_id', listId);
      if (error) throw error;
    },
    onMutate: async (updates) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['list-settings', listId] });
      const previous = qc.getQueryData<ListSettings>(['list-settings', listId]);
      if (previous) {
        qc.setQueryData(['list-settings', listId], { ...previous, ...updates });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['list-settings', listId], context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['list-settings', listId] }),
  });
}

export function useListStatuses(listId: string) {
  return useQuery({
    queryKey: ['list-statuses', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_statuses')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as ListStatus[];
    },
    enabled: !!listId,
  });
}

export function useCreateStatus(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: maxRow } = await supabase
        .from('list_statuses')
        .select('position')
        .eq('list_id', listId)
        .order('position', { ascending: false })
        .limit(1)
        .single();
      const position = (maxRow?.position ?? -1) + 1;
      const { error } = await supabase
        .from('list_statuses')
        .insert({ list_id: listId, name, position });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list-statuses', listId] }),
  });
}

export function useDeleteStatus(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await supabase.from('list_statuses').delete().eq('id', statusId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list-statuses', listId] }),
  });
}
