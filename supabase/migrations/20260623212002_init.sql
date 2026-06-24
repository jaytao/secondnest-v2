create extension if not exists pgcrypto;
create extension if not exists postgis;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- profiles --------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  location geography(point, 4326),
  location_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;

create policy "profiles are viewable by everyone"
  on profiles for select using (true);

create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);

-- listings ---------------------------------------------------------------

create type listing_status as enum ('active', 'pending', 'given_away', 'removed');

create table listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  status listing_status not null default 'active',
  location geography(point, 4326),
  location_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_owner_idx on listings (owner_id);
create index listings_location_idx on listings using gist (location);
create index listings_status_idx on listings (status);

create trigger listings_set_updated_at
  before update on listings
  for each row execute function set_updated_at();

alter table listings enable row level security;

create policy "listings are viewable by everyone"
  on listings for select using (true);

create policy "users can insert own listings"
  on listings for insert with check (auth.uid() = owner_id);

create policy "users can update own listings"
  on listings for update using (auth.uid() = owner_id);

create policy "users can delete own listings"
  on listings for delete using (auth.uid() = owner_id);

-- listing images -----------------------------------------------------------

create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index listing_images_listing_idx on listing_images (listing_id);

alter table listing_images enable row level security;

create policy "listing images are viewable by everyone"
  on listing_images for select using (true);

create policy "owners manage their listing images"
  on listing_images for all
  using (exists (select 1 from listings l where l.id = listing_images.listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from listings l where l.id = listing_images.listing_id and l.owner_id = auth.uid()));

-- tags ---------------------------------------------------------------------

create type tag_category as enum ('item_type', 'age_range', 'condition');

create table tags (
  id uuid primary key default gen_random_uuid(),
  category tag_category not null,
  value text not null,
  unique (category, value)
);

create table listing_tags (
  listing_id uuid not null references listings (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (listing_id, tag_id)
);

create index listing_tags_tag_idx on listing_tags (tag_id);

alter table tags enable row level security;
alter table listing_tags enable row level security;

create policy "tags are viewable by everyone"
  on tags for select using (true);

create policy "listing tags are viewable by everyone"
  on listing_tags for select using (true);

create policy "owners manage their listing tags"
  on listing_tags for all
  using (exists (select 1 from listings l where l.id = listing_tags.listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from listings l where l.id = listing_tags.listing_id and l.owner_id = auth.uid()));

insert into tags (category, value) values
  ('item_type', 'clothing'),
  ('item_type', 'gear'),
  ('item_type', 'toys'),
  ('item_type', 'feeding'),
  ('item_type', 'nursery'),
  ('item_type', 'maternity'),
  ('age_range', '0-3m'),
  ('age_range', '3-6m'),
  ('age_range', '6-12m'),
  ('age_range', '1-2y'),
  ('age_range', '2-4y'),
  ('age_range', '4y+'),
  ('condition', 'new'),
  ('condition', 'like_new'),
  ('condition', 'good'),
  ('condition', 'worn');

-- conversations & messages --------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  buyer_id uuid not null references profiles (id) on delete cascade,
  seller_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create index conversations_buyer_idx on conversations (buyer_id);
create index conversations_seller_idx on conversations (seller_id);

alter table conversations enable row level security;

create policy "participants can view their conversations"
  on conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "buyers can start a conversation"
  on conversations for insert
  with check (
    auth.uid() = buyer_id
    and buyer_id <> seller_id
    and seller_id = (select owner_id from listings where id = listing_id)
  );

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at);

alter table messages enable row level security;

create policy "participants can view messages"
  on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));

create policy "participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- storage: listing photos ---------------------------------------------------

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "listing images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "users can upload their own listing images"
  on storage.objects for insert
  with check (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users can delete their own listing images"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);
