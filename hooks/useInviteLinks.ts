import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ListInviteLink, ListMemberRole } from '@/types/database';

export function useInviteLinks(listId: string) {
  return useQuery({
    queryKey: ['invite-links', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_invite_links')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ListInviteLink[];
    },
    enabled: !!listId,
  });
}

export function useCreateInviteLink(listId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (opts: {
      role: ListMemberRole;
      maxUses?: number;
      expiresHours?: number;
    }) => {
      const expires_at = opts.expiresHours
        ? new Date(Date.now() + opts.expiresHours * 3600 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('list_invite_links')
        .insert({
          list_id: listId,
          created_by: user!.id,
          role: opts.role,
          max_uses: opts.maxUses ?? null,
          expires_at,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ListInviteLink;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invite-links', listId] }),
  });
}

export function useDeleteInviteLink(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from('list_invite_links').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invite-links', listId] }),
  });
}

export function useRedeemInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      // Look up the invite link
      const { data: link, error: linkError } = await supabase
        .from('list_invite_links')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (linkError || !link) throw new Error('Invalid or expired invite link');

      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        throw new Error('This invite link has expired');
      }

      if (link.max_uses !== null && link.used_count >= link.max_uses) {
        throw new Error('This invite link has reached its maximum uses');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to join a list');

      // Insert member (ON CONFLICT DO NOTHING via RLS/unique constraint)
      const { error: memberError } = await supabase
        .from('list_members')
        .insert({ list_id: link.list_id, user_id: user.id, role: link.role, invited_by: link.created_by });

      if (memberError && !memberError.message.includes('duplicate')) {
        throw memberError;
      }

      // Increment used count
      await supabase
        .from('list_invite_links')
        .update({ used_count: link.used_count + 1 })
        .eq('id', link.id);

      return { listId: link.list_id };
    },
  });
}
