import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ListItem, SortBy } from '@/types/database';

export const itemKeys = {
  all: (listId: string) => ['list-items', listId] as const,
  detail: (itemId: string) => ['list-item', itemId] as const,
};

export function useListItems(listId: string, sortBy: SortBy = 'manual') {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...itemKeys.all(listId), sortBy],
    queryFn: async () => {
      let query = supabase
        .from('list_items')
        .select(`
          *,
          list_votes(vote_type, user_id),
          list_ratings(rating, user_id),
          list_item_comments(count)
        `)
        .eq('list_id', listId);

      if (sortBy === 'votes') {
        query = query.order('upvotes', { ascending: false });
      } else if (sortBy === 'shuffle') {
        // Fetch all and shuffle client-side
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('position', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;

      let items = (data ?? []).map((item) => {
        const myVoteRow = (item.list_votes as any[])?.find(
          (v: any) => v.user_id === user?.id
        );
        const myRatingRow = (item.list_ratings as any[])?.find(
          (r: any) => r.user_id === user?.id
        );
        const commentCount = (item.list_item_comments as any[])?.[0]?.count ?? 0;

        return {
          ...item,
          myVote: (myVoteRow?.vote_type ?? null) as 1 | -1 | null,
          myRating: (myRatingRow?.rating ?? null) as number | null,
          commentCount: Number(commentCount),
          list_votes: undefined,
          list_ratings: undefined,
          list_item_comments: undefined,
        } as ListItem;
      });

      if (sortBy === 'shuffle') {
        items = items.sort(() => Math.random() - 0.5);
      } else if (sortBy === 'ratings') {
        items = items.sort((a, b) => (b.myRating ?? 0) - (a.myRating ?? 0));
      }

      return items;
    },
    enabled: !!listId,
  });
}

export function useListItem(itemId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_items')
        .select(`
          *,
          list_votes(vote_type, user_id),
          list_ratings(rating, user_id),
          list_item_comments(count)
        `)
        .eq('id', itemId)
        .single();
      if (error) throw error;

      const myVoteRow = (data.list_votes as any[])?.find((v: any) => v.user_id === user?.id);
      const myRatingRow = (data.list_ratings as any[])?.find((r: any) => r.user_id === user?.id);
      const commentCount = (data.list_item_comments as any[])?.[0]?.count ?? 0;

      return {
        ...data,
        myVote: (myVoteRow?.vote_type ?? null) as 1 | -1 | null,
        myRating: (myRatingRow?.rating ?? null) as number | null,
        commentCount: Number(commentCount),
        list_votes: undefined,
        list_ratings: undefined,
        list_item_comments: undefined,
      } as ListItem;
    },
    enabled: !!itemId,
  });
}

export function useCreateItem(listId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      url?: string;
      status?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }) => {
      // Get current max position
      const { data: maxRow } = await supabase
        .from('list_items')
        .select('position')
        .eq('list_id', listId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const position = (maxRow?.position ?? -1) + 1;

      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          user_id: user!.id,
          title: input.title,
          description: input.description ?? null,
          url: input.url ?? null,
          status: input.status ?? null,
          tags: input.tags ?? [],
          metadata: input.metadata ?? {},
          position,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list-items', listId] }),
  });
}

export function useUpdateItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: Partial<Pick<ListItem, 'title' | 'description' | 'url' | 'status' | 'tags' | 'completed'>>;
    }) => {
      const { error } = await supabase
        .from('list_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['list-items', listId] });
      qc.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
    },
  });
}

export function useDeleteItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('list_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list-items', listId] }),
  });
}

export function useReorderItems(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('list_items').update({ position: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list-items', listId] }),
  });
}
