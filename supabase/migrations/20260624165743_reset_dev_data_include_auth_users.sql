-- Dev/test utility only. Updates reset_dev_data() to also delete auth.users,
-- not just profiles. Leaving auth.users intact let accounts outlive their
-- profile row (e.g. after a reset), which broke OAuth logins for those
-- accounts since the profile-creation trigger only fires on a *new*
-- auth.users insert, not on a returning login. Deleting auth.users cascades
-- through profiles -> listings -> listing_images/listing_tags/conversations
-- -> messages via existing FKs, so the separate truncate is no longer needed.
--
-- Still deliberately not granted to anon/authenticated.
create or replace function reset_dev_data()
returns void
language sql
as $$
  delete from auth.users;
$$;
