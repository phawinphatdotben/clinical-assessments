-- Optional per-skill DOPS rubric PDF URL (public link or Supabase Storage URL).
-- Safe to run repeatedly.

alter table if exists public.skills
  add column if not exists rubric_pdf_url text;

comment on column public.skills.rubric_pdf_url is
  'Public URL to PDF rubric for this procedure; used by DOPS form + logbook when set.';
