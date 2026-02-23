import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { List, ListPublicAccess } from '@/types/database';

export const listKeys = {
  all: ['lists'] as const,
  mine: () => [...listKeys.all, 'mine'] as const,
  shared: () => [...listKeys.all, 'shared'] as const,
  public: () => [...listKeys.all, 'public'] as const,
  detail: (id: string) => [...listKeys.all, 'detail', id] as const,
};

export function useMyLists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: listKeys.mine(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*, list_settings(*)')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as List[];
    },
    enabled: !!user,
  });
}

export function useSharedLists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: listKeys.shared(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_members')
        .select('list:list_id(*, list_settings(*))')
        .eq('user_id', user!.id);
      if (error) throw error;
      const lists = data
        ?.map((d) => d.list as unknown as List)
        .filter((l) => l && l.user_id !== user!.id) ?? [];
      return lists;
    },
    enabled: !!user,
  });
}

export function usePublicLists() {
  return useQuery({
    queryKey: listKeys.public(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*, list_settings(*)')
        .in('public_access_mode', ['members', 'anyone'])
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as List[];
    },
  });
}

export function useList(id: string) {
  return useQuery({
    queryKey: listKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*, list_settings(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as List;
    },
    enabled: !!id,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('lists')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as List;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKeys.mine() }),
  });
}

export function useUpdateList(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<List, 'name' | 'description' | 'public_access_mode'>>) => {
      const { error } = await supabase
        .from('lists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKeys.detail(id) });
      qc.invalidateQueries({ queryKey: listKeys.mine() });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKeys.all }),
  });
}
