import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ListItemComment } from '@/types/database';

export function useComments(itemId: string) {
  return useQuery({
    queryKey: ['comments', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_item_comments')
        .select('*, user_profiles(id, username, email)')
        .eq('list_item_id', itemId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ListItemComment[];
    },
    enabled: !!itemId,
  });
}

export function useAddComment(itemId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (comment: string) => {
      const { data, error } = await supabase
        .from('list_item_comments')
        .insert({ list_item_id: itemId, user_id: user!.id, comment })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', itemId] }),
  });
}

export function useDeleteComment(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('list_item_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', itemId] }),
  });
}
