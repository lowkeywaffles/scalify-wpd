-- 0002: customer quote links, tour progress, message language, link-sourced activity.
-- Safe to run more than once.

alter table public.quotes
  add column if not exists share_token text unique check (share_token is null or char_length(share_token) between 32 and 64),
  add column if not exists share_enabled boolean not null default false;

alter table public.activities
  add column if not exists via_link boolean not null default false; -- true when the customer answered via their quote link

alter table public.businesses
  add column if not exists tour_seen text[] not null default '{}' check (cardinality(tour_seen) <= 50),
  add column if not exists message_language text not null default 'en' check (message_language in ('en','ar','fr','es'));

-- Public quote pages are served by the server with the service role (lookup by unguessable token only).
-- No anonymous RLS policy is added, so the public anon key still cannot read any quote.
