import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ListMember, ListMemberRole } from '@/types/database';

export function useMembers(listId: string) {
  return useQuery({
    queryKey: ['members', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_members')
        .select('*, user_profiles(id, username, email)')
        .eq('list_id', listId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ListMember[];
    },
    enabled: !!listId,
  });
}

export function useUpdateMemberRole(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: ListMemberRole }) => {
      const { error } = await supabase
        .from('list_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', listId] }),
  });
}

export function useRemoveMember(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('list_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', listId] }),
  });
}

export function useMyMembership(listId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-membership', listId],
    queryFn: async () => {
      const { data } = await supabase
        .from('list_members')
        .select('role')
        .eq('list_id', listId)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.role as ListMemberRole | null;
    },
    enabled: !!listId && !!user,
  });
}
