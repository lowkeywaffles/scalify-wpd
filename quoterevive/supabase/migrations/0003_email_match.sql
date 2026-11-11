-- 0003: let the server match a Whop buyer's email to a QuoteRevive workspace (store purchases without a tag).
-- Only confirmed emails match. Callable by the service role only.
create or replace function public.business_id_for_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select b.id from public.businesses b
  join auth.users u on u.id = b.owner_id
  where lower(u.email) = lower(trim(p_email)) and u.email_confirmed_at is not null
  limit 1
$$;
revoke all on function public.business_id_for_email(text) from public, anon, authenticated;
grant execute on function public.business_id_for_email(text) to service_role;
