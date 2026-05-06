-- Public bucket for PDF rubrics uploaded from Admin DOPS logbook.
-- Run once in Supabase SQL editor, then use the Storage UI to confirm the bucket exists.

insert into storage.buckets (id, name, public)
values ('dops-rubric-pdfs', 'dops-rubric-pdfs', true)
on conflict (id) do nothing;

drop policy if exists "public read dops rubric pdfs" on storage.objects;
create policy "public read dops rubric pdfs"
on storage.objects
for select
to public
using (bucket_id = 'dops-rubric-pdfs');

drop policy if exists "admin upload dops rubric pdfs" on storage.objects;
create policy "admin upload dops rubric pdfs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dops-rubric-pdfs'
  and exists (
    select 1
    from public."Users" as u
    where lower(coalesce(u."Email", '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and lower(coalesce(u."Role", '')) = 'admin'
      and (
        coalesce(u."Is Approved", false) = true
        or lower(coalesce(u."Status", '')) = 'approved'
      )
  )
);

drop policy if exists "admin update dops rubric pdfs" on storage.objects;
create policy "admin update dops rubric pdfs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'dops-rubric-pdfs'
  and exists (
    select 1
    from public."Users" as u
    where lower(coalesce(u."Email", '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and lower(coalesce(u."Role", '')) = 'admin'
      and (
        coalesce(u."Is Approved", false) = true
        or lower(coalesce(u."Status", '')) = 'approved'
      )
  )
);
