// Supabase Edge Function — Push Notifications
// Triggered by Database Webhooks on 3 events:
//   1. list_items INSERT  → notify list members
//   2. list_item_comments INSERT → notify item owner + other commenters
//   3. list_members INSERT → notify newly added member
//
// Deploy: supabase functions deploy push-notifications --no-verify-jwt
// Set secrets: supabase secrets set SUPABASE_WEBHOOK_SECRET=... SUPABASE_SERVICE_ROLE_KEY=...

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
  badge: number;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
  schema: string;
}

async function sendPushMessages(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  await Promise.all(
    chunks.map((chunk) =>
      fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      })
    )
  );
}

async function getTokensForUsers(
  supabase: ReturnType<typeof createClient>,
  userIds: string[]
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data } = await supabase
    .from('user_push_tokens')
    .select('token')
    .in('user_id', userIds);
  return (data ?? []).map((row: any) => row.token);
}

serve(async (req) => {
  // Validate webhook secret
  const authHeader = req.headers.get('Authorization');
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload: WebhookPayload = await req.json();
  if (payload.type !== 'INSERT') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const messages: PushMessage[] = [];

  if (payload.table === 'list_items') {
    const item = payload.record;

    // Get all members of the list except the item creator
    const { data: members } = await supabase
      .from('list_members')
      .select('user_id')
      .eq('list_id', item.list_id)
      .neq('user_id', item.user_id);

    const memberIds = (members ?? []).map((m: any) => m.user_id);
    const tokens = await getTokensForUsers(supabase, memberIds);

    const { data: list } = await supabase
      .from('lists')
      .select('name')
      .eq('id', item.list_id)
      .single();

    for (const token of tokens) {
      messages.push({
        to: token,
        title: `New item in "${list?.name ?? 'a list'}"`,
        body: String(item.title),
        data: { type: 'new_item', list_id: item.list_id },
        sound: 'default',
        badge: 1,
      });
    }
  } else if (payload.table === 'list_item_comments') {
    const comment = payload.record;

    const { data: item } = await supabase
      .from('list_items')
      .select('user_id, list_id, title')
      .eq('id', comment.list_item_id)
      .single();

    const { data: otherCommenters } = await supabase
      .from('list_item_comments')
      .select('user_id')
      .eq('list_item_id', comment.list_item_id)
      .neq('user_id', comment.user_id);

    const notifyIds = new Set<string>();
    if (item?.user_id && item.user_id !== comment.user_id) {
      notifyIds.add(item.user_id);
    }
    for (const c of (otherCommenters ?? []) as any[]) notifyIds.add(c.user_id);

    const tokens = await getTokensForUsers(supabase, Array.from(notifyIds));

    for (const token of tokens) {
      messages.push({
        to: token,
        title: `New comment on "${item?.title}"`,
        body: String(comment.comment).slice(0, 100),
        data: {
          type: 'new_comment',
          list_id: item?.list_id,
          item_id: comment.list_item_id,
        },
        sound: 'default',
        badge: 1,
      });
    }
  } else if (payload.table === 'list_members') {
    const member = payload.record;

    const { data: list } = await supabase
      .from('lists')
      .select('name')
      .eq('id', member.list_id)
      .single();

    const tokens = await getTokensForUsers(supabase, [String(member.user_id)]);

    for (const token of tokens) {
      messages.push({
        to: token,
        title: 'You were added to a list',
        body: `You now have access to "${list?.name}"`,
        data: { type: 'new_member', list_id: member.list_id },
        sound: 'default',
        badge: 1,
      });
    }
  }

  await sendPushMessages(messages);
  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
