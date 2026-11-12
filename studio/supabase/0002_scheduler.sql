-- Runs the Studio publisher every 5 minutes (Vercel Hobby crons are daily only).
-- The shared secret is generated here, inside the Supabase vault, and never leaves the database:
-- /api/cron/publish checks it through studio_check_cron_token(). Safe to run more than once.
create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'studio_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'studio_cron_secret');
  end if;
end $$;

create or replace function public.studio_check_cron_token(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'studio_cron_secret' and decrypted_secret = p_token);
$$;
revoke all on function public.studio_check_cron_token(text) from public, anon, authenticated;
grant execute on function public.studio_check_cron_token(text) to service_role;

select cron.unschedule('studio-publish') where exists (select 1 from cron.job where jobname = 'studio-publish');
select cron.schedule(
  'studio-publish',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://scalify-studio.vercel.app/api/cron/publish',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'studio_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);

select cron.unschedule('studio-net-cleanup') where exists (select 1 from cron.job where jobname = 'studio-net-cleanup');
select cron.schedule('studio-net-cleanup', '23 3 * * *', $job$ delete from net._http_response where created < now() - interval '2 days' $job$);
