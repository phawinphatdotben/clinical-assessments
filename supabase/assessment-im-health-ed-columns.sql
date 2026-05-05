-- Internal Medicine · Health Education form (Form Type = 'Internal Medicine Health Education').
-- Run in Supabase SQL editor if you already ran assessment-add-columns.sql without these lines.

alter table public."Assessment"
  add column if not exists "IM Health Ed-Assess baseline SCORE" text,
  add column if not exists "IM Health Ed-Information delivery SCORE" text,
  add column if not exists "IM Health Ed-Teach-back and engagement SCORE" text,
  add column if not exists "IM Health Ed-Empowerment and shared planning SCORE" text,
  add column if not exists "IM Health Ed-Communication skills (patient) SCORE" text,
  add column if not exists "IM Health Ed-Professionalism checklist SCORE" text;
