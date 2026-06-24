alter table conversations
  add column buyer_last_read_at timestamptz,
  add column seller_last_read_at timestamptz;

create policy "participants can update their own read receipt"
  on conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Per-conversation count of messages sent by the other participant since the
-- caller last read it. Run as the caller (not security definer) so RLS still
-- restricts results to conversations they're actually part of.
create or replace function unread_message_counts()
returns table (conversation_id uuid, unread_count bigint)
language sql
stable
as $$
  select
    m.conversation_id,
    count(*) as unread_count
  from messages m
  join conversations c on c.id = m.conversation_id
  where m.sender_id <> auth.uid()
    and (
      (c.buyer_id = auth.uid() and m.created_at > coalesce(c.buyer_last_read_at, '-infinity'))
      or (c.seller_id = auth.uid() and m.created_at > coalesce(c.seller_last_read_at, '-infinity'))
    )
  group by m.conversation_id;
$$;

grant execute on function unread_message_counts() to authenticated;

create or replace function mark_conversation_read(conversation_id uuid)
returns void
language sql
as $$
  update conversations
  set
    buyer_last_read_at = case when buyer_id = auth.uid() then now() else buyer_last_read_at end,
    seller_last_read_at = case when seller_id = auth.uid() then now() else seller_last_read_at end
  where id = conversation_id
    and (buyer_id = auth.uid() or seller_id = auth.uid());
$$;

grant execute on function mark_conversation_read(uuid) to authenticated;
