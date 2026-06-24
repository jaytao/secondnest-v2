-- Lets the chat UI subscribe to new messages/conversations via Supabase Realtime
-- instead of polling. RLS still applies to what each client actually receives.
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
