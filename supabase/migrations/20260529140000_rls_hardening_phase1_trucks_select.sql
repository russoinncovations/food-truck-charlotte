-- Phase 1 RLS hardening: public trucks SELECT aligned with PUBLIC_LISTED_TRUCK_EQ.
-- App already filters: show_in_directory = true, is_active = true, status = 'active'.
-- Does not remove vendor email from listed rows; Phase 3 view handles column-level PII.
--
-- ROLLBACK (restores prior broad anon read — not recommended in production):
--   drop policy if exists "Public read listed trucks" on public.trucks;
--   create policy "Allow public read on trucks"
--     on public.trucks for select
--     to anon
--     using (true);
--
-- Preserves (do not drop): "Truck owner selects own trucks row" — authenticated vendors
-- read their own truck even when not listed (show_in_directory = false).

drop policy if exists "Allow public read on trucks" on public.trucks;

create policy "Public read listed trucks"
  on public.trucks
  for select
  to anon, authenticated
  using (
    show_in_directory = true
    and is_active = true
    and status = 'active'
  );
