-- Optional department/rotation for each DOPS skill row.
-- NULL = skill applies to every rotation; otherwise must match Assessment "Department/Rotation" values.
-- Run in Supabase SQL editor after public.skills exists.

alter table if exists public.skills
  add column if not exists department text;

comment on column public.skills.department is
  'Rotation label (e.g. Internal Medicine). NULL means the procedure is listed for all rotations.';

create index if not exists idx_skills_department on public.skills (department);
