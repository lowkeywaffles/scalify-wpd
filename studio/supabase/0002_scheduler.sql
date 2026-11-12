-- Runs the Studio publisher every 5 minutes (Vercel Hobby crons are daily only).
-- Before running: replace __STUDIO_URL__ with the deployed URL, and store the same random value as
-- CRON_SECRET in Vercel and in the vault (once):
--   select vault.create_secret('<the CRON_SECRET value>', 'studio_cron_secret');
create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.unschedule('studio-publish') where exists (select 1 from cron.job where jobname = 'studio-publish');
select cron.schedule(
  'studio-publish',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := '__STUDIO_URL__/api/cron/publish',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'studio_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Keep pg_net's response log small.
select cron.unschedule('studio-net-cleanup') where exists (select 1 from cron.job where jobname = 'studio-net-cleanup');
select cron.schedule('studio-net-cleanup', '23 3 * * *', $$ delete from net._http_response where created < now() - interval '2 days' $$);
