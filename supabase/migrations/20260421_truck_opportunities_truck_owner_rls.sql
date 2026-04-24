-- Vendor dashboard: truck_opportunities + booking_requests (embed) for authenticated truck owners.
-- Auth link: public.trucks.email matches auth.jwt() ->> 'email' (no trucks.user_id in schema).
-- Aligns with existing "Truck owner selects own trucks row" in 20260327120000_event_marketplace.sql.

-- ---------------------------------------------------------------------------
-- truck_opportunities
-- ---------------------------------------------------------------------------
-- 20260418_rls_and_public_policies enables RLS here but the repo had no
-- per-role policies. With RLS and no policy, the table is not readable/writable
-- for authenticated (or anon) as intended — this migration adds the missing rules.

-- Public booking flow (anon) inserts opportunity rows after inserting booking_requests.
drop policy if exists "Allow anon insert truck_opportunities" on public.truck_opportunities;
create policy "Allow anon insert truck_opportunities"
  on public.truck_opportunities
  for insert
  to anon
  with check (true);

-- Vendors: list + update only rows for the truck that matches their login email.
drop policy if exists "Truck owner selects own truck opportunities" on public.truck_opportunities;
create policy "Truck owner selects own truck opportunities"
  on public.truck_opportunities
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_opportunities.truck_id
        and lower(trim(coalesce(t.email, '')))
          = lower(trim(coalesce((select auth.jwt()) ->> 'email', '')))
    )
  );

drop policy if exists "Truck owner updates own truck opportunities" on public.truck_opportunities;
create policy "Truck owner updates own truck opportunities"
  on public.truck_opportunities
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_opportunities.truck_id
        and lower(trim(coalesce(t.email, '')))
          = lower(trim(coalesce((select auth.jwt()) ->> 'email', '')))
    )
  )
  with check (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_opportunities.truck_id
        and lower(trim(coalesce(t.email, '')))
          = lower(trim(coalesce((select auth.jwt()) ->> 'email', '')))
    )
  );

-- Optional stricter check (uncomment if column names match your DB):
--   and truck_opportunities.status in ('pending', 'interested', 'pass');

-- ---------------------------------------------------------------------------
-- booking_requests (nested select in .select('*, booking_requests(*)'))
-- ---------------------------------------------------------------------------
-- 20260418 only allows anon INSERT. Vendors need SELECT on rows that appear in
-- their truck_opportunities, or the join/embed returns no booking data.

drop policy if exists "Truck owner selects linked booking requests" on public.booking_requests;
create policy "Truck owner selects linked booking requests"
  on public.booking_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.truck_opportunities o
      join public.trucks t on t.id = o.truck_id
      where o.booking_request_id = booking_requests.id
        and lower(trim(coalesce(t.email, '')))
          = lower(trim(coalesce((select auth.jwt()) ->> 'email', '')))
    )
  );
