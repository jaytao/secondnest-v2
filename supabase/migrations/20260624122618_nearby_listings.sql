-- Returns ids of active listings within radius_meters of (lat, lon), nearest first.
-- A plain PostgREST filter can't express a radius query, so this is exposed as an RPC
-- the client calls via supabase.rpc('nearby_listings', { lat, lon, radius_meters }).
create or replace function nearby_listings(lat double precision, lon double precision, radius_meters double precision)
returns table (id uuid, distance_meters double precision)
language sql
stable
as $$
  select
    listings.id,
    st_distance(listings.location, st_setsrid(st_makepoint(lon, lat), 4326)::geography) as distance_meters
  from listings
  where listings.status = 'active'
    and listings.location is not null
    and st_dwithin(listings.location, st_setsrid(st_makepoint(lon, lat), 4326)::geography, radius_meters)
  order by distance_meters asc;
$$;

grant execute on function nearby_listings(double precision, double precision, double precision) to anon, authenticated;
