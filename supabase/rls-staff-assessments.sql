-- Staff can SELECT and UPDATE Assessment rows they own as evaluator:
--   - Evaluator Email matches their login email (forms they submitted), OR
--   - Staff ID matches their directory Staff ID (e.g. student picked them as evaluator).
-- Run after rls-student-dashboard.sql; adjust "Role" column name if yours differs.

alter table public."Assessment" enable row level security;

drop policy if exists "Staff select linked assessments" on public."Assessment";
drop policy if exists "Staff update linked assessments" on public."Assessment";

create policy "Staff select linked assessments"
on public."Assessment"
for select
to authenticated
using (
  exists (
    select 1
    from public."Users" as me
    where lower(trim(me."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
      and me."Role" ilike 'staff'
      and (
        lower(trim(coalesce(me."Email", ''))) =
          lower(trim(coalesce("Evaluator Email", '')))
        or trim(coalesce(me."Staff ID"::text, '')) = trim(coalesce("Staff ID"::text, ''))
      )
  )
);

create policy "Staff update linked assessments"
on public."Assessment"
for update
to authenticated
using (
  exists (
    select 1
    from public."Users" as me
    where lower(trim(me."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
      and me."Role" ilike 'staff'
      and (
        lower(trim(coalesce(me."Email", ''))) =
          lower(trim(coalesce("Evaluator Email", '')))
        or trim(coalesce(me."Staff ID"::text, '')) = trim(coalesce("Staff ID"::text, ''))
      )
  )
)
with check (
  exists (
    select 1
    from public."Users" as me
    where lower(trim(me."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
      and me."Role" ilike 'staff'
      and (
        lower(trim(coalesce(me."Email", ''))) =
          lower(trim(coalesce("Evaluator Email", '')))
        or trim(coalesce(me."Staff ID"::text, '')) = trim(coalesce("Staff ID"::text, ''))
      )
  )
);
