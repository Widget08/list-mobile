import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { itemKeys } from './useListItems';

export function useVoteItem(listId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ itemId, voteType }: { itemId: string; voteType: 1 | -1 | null }) => {
      if (!user) throw new Error('Not authenticated');

      // Check for existing vote
      const { data: existing } = await supabase
        .from('list_votes')
        .select('id, vote_type')
        .eq('list_item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (voteType === null || existing?.vote_type === voteType) {
        // Remove vote
        if (existing) {
          await supabase.from('list_votes').delete().eq('id', existing.id);
          const delta = existing.vote_type === 1 ? -1 : 1;
          await supabase
            .from('list_items')
            .update({ upvotes: supabase.rpc('increment', { x: delta } as any) as any })
            .eq('id', itemId);
        }
        return;
      }

      if (existing) {
        // Change vote
        await supabase
          .from('list_votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id);
        const delta = voteType === 1 ? 2 : -2;
        await supabase.rpc('increment_upvotes', { item_id: itemId, delta } as any);
      } else {
        // New vote
        await supabase
          .from('list_votes')
          .insert({ list_item_id: itemId, user_id: user.id, vote_type: voteType });
        const delta = voteType === 1 ? 1 : -1;
        await supabase.rpc('increment_upvotes', { item_id: itemId, delta } as any);
      }
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['list-items', listId] });
      qc.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
    },
  });
}

export function useRateItem(listId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ itemId, rating }: { itemId: string; rating: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('list_ratings')
        .select('id')
        .eq('list_item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('list_ratings')
          .update({ rating })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('list_ratings')
          .insert({ list_item_id: itemId, user_id: user.id, rating });
      }
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['list-items', listId] });
      qc.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
    },
  });
}
