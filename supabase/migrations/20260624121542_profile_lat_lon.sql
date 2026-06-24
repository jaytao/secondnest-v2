-- PostgREST returns `geography` columns as WKB hex by default, which the client can't use
-- directly. Generated lat/lon columns let the frontend read back a usable location without
-- parsing WKB or adding a PostGIS-aware RPC just for this.
alter table profiles
  add column latitude double precision generated always as (st_y(location::geometry)) stored,
  add column longitude double precision generated always as (st_x(location::geometry)) stored;
