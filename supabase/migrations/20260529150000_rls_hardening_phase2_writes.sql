-- Phase 2 RLS hardening: remove unsafe anon INSERT/UPDATE on trucks and truck_opportunities.
-- Code prep (20260529150000 app changes): booking fan-out and admin truck writes use service role;
-- vendor profile / Go Live updates use authenticated session + ownership below.
--
-- Preserves (unchanged by this migration):
--   booking_requests — public anon INSERT (booking form)
--   vendor_applications — public anon INSERT (list-your-truck form)
--   truck_scheduled_stops — vendor-owned RLS from 20260528120000
--   truck_photos — vendor/admin RLS from 20260528130000
--   truck_opportunities — "Truck owner selects/updates own truck opportunities" (authenticated)
--   trucks — "Truck owner selects own trucks row", "Public read listed trucks" (Phase 1)
--
-- ROLLBACK (restores open anon writes — not recommended in production):
--   drop policy if exists "Vendor update own trucks row" on public.trucks;
--   create policy "Allow anon insert on trucks"
--     on public.trucks for insert
--     to anon, authenticated
--     with check (true);
--   create policy "Allow anon update on trucks"
--     on public.trucks for update
--     to anon, authenticated
--     using (true)
--     with check (true);
--   create policy "Allow anon insert truck_opportunities"
--     on public.truck_opportunities for insert
--     to anon
--     with check (true);

-- ---------------------------------------------------------------------------
-- truck_opportunities: server-side fan-out only (service role bypasses RLS)
-- ---------------------------------------------------------------------------
drop policy if exists "Allow anon insert truck_opportunities" on public.truck_opportunities;

-- ---------------------------------------------------------------------------
-- trucks: admin creates via service role; vendors update own row when signed in
-- ---------------------------------------------------------------------------
drop policy if exists "Allow anon insert on trucks" on public.trucks;
drop policy if exists "Allow anon update on trucks" on public.trucks;

create policy "Vendor update own trucks row"
  on public.trucks
  for update
  to authenticated
  using (
    lower(trim(coalesce(email, ''))) =
    lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  )
  with check (
    lower(trim(coalesce(email, ''))) =
    lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );
