-- Allow Admins to read all Assessment rows (for dashboard search + portfolio).
-- Adjust "Role" / "Email" column names if your Users table differs.

drop policy if exists "Admin select all assessments" on public."Assessment";

create policy "Admin select all assessments"
on public."Assessment"
for select
to authenticated
using (
  exists (
    select 1
    from public."Users" as u
    where lower(trim(u."Email")) = lower(trim(coalesce((auth.jwt() ->> 'email'), '')))
      and u."Role" ilike 'admin'
  )
);
