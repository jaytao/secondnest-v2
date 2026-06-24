-- Dev/test utility only. Wipes profiles, listings, and messages (cascading to
-- dependent tables: listing_images, listing_tags, conversations). Does NOT
-- touch auth.users, so accounts/logins survive a reset.
--
-- Deliberately not granted to anon/authenticated — call it from the SQL editor
-- or psql as a privileged role (e.g. `select reset_dev_data();`), never from
-- client code.
create or replace function reset_dev_data()
returns void
language sql
as $$
  truncate table profiles, listings, messages cascade;
$$;
