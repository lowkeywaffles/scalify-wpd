-- Manual access provisioning for first paid customers (run in the Supabase SQL editor as the project owner).
-- 1. Confirm the payment in your Whop dashboard first. Never grant access from a screenshot or a redirect.
-- 2. Replace the email below with the customer's QuoteRevive login email.
insert into public.entitlements (business_id, source, status, plan)
select b.id, 'manual', 'active', 'founding'
from public.businesses b join auth.users u on u.id = b.owner_id
where u.email = 'customer@example.com'
on conflict (business_id) do update set status = 'active', source = 'manual', updated_at = now();

-- Revoke (e.g. after a refund):
-- update public.entitlements set status = 'revoked', updated_at = now()
-- where business_id = (select b.id from public.businesses b join auth.users u on u.id = b.owner_id where u.email = 'customer@example.com');
