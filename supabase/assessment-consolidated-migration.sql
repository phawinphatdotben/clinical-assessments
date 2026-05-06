  -- Consolidated Assessment schema migration (idempotent).
  -- Run this single file in Supabase SQL editor for all form fields currently used by the app.
  -- Also applies DOPS logbook helpers (skills.rubric_pdf_url, storage bucket, catalog/progress views, optional UAC/UVC seed).
  -- Requires public.skills when creating views; see supabase/rls-skills-logbook.sql first if that table is missing.

  alter table public."Assessment"
    add column if not exists "Student ID" text,
    add column if not exists "Staff ID" text,
    add column if not exists "Hospital" text,
    add column if not exists "Department/Rotation" text,
    add column if not exists "Evaluator Role" text,
    add column if not exists "Patient HN" text,
    add column if not exists "Setting" text,
    add column if not exists "Procedure Name" text,
    add column if not exists "Case Complexity" text,
    add column if not exists "Overall Performance Result" text,
    add column if not exists "Evaluator Feedback: What went well" text,
    add column if not exists "Evaluator Feedback: Areas to improve" text,
    add column if not exists "Evaluator Email" text,
    add column if not exists "Form Type" text,
    add column if not exists "Status" text,
    add column if not exists "Evaluator Name" text,
    add column if not exists "Student Self-Reflection" text,
    add column if not exists "Self Reflection Deadline" text,
    add column if not exists "Criteria Score Sum" numeric;

  alter table public."Assessment"
    add column if not exists "DOPS - Before: Indications/Complications" text,
    add column if not exists "DOPS - Before: Consent" text,
    add column if not exists "DOPS - Before: Preparation" text,
    add column if not exists "DOPS - During: Patient Comfort" text,
    add column if not exists "DOPS - During: Procedure Steps" text,
    add column if not exists "DOPS - During: Aseptic" text,
    add column if not exists "DOPS - During: Problem Solving" text,
    add column if not exists "DOPS - After: Post-procedure Care" text,
    add column if not exists "DOPS - After: Communication" text,
    add column if not exists "DOPS - Patient Empathy" text,
    add column if not exists "DOPS - Pre Performance practice preparation" text,
    add column if not exists "DOPS - Overall Performance" text;

  alter table public."Assessment"
    add column if not exists "Extern-History Taking SCORE" text,
    add column if not exists "Extern-Physical Exam SCORE" text,
    add column if not exists "Extern-Diagnosis & Diff Dx SCORE" text,
    add column if not exists "Extern-Management Plan SCORE" text,
    add column if not exists "Extern-Communication Skills SCORE" text,
    add column if not exists "Extern-Professionalism SCORE" text;

  alter table public."Assessment"
    add column if not exists "JC-1.1 Rationale/Importance SCORE" text,
    add column if not exists "JC-1.2 Methodology Overview SCORE" text,
    add column if not exists "JC-1.3 Results Overview SCORE" text,
    add column if not exists "JC-1.4 Discussion & Conclusion SCORE" text,
    add column if not exists "JC-2.1 Strengths & Limitations SCORE" text,
    add column if not exists "JC-2.2 Clinical Application SCORE" text,
    add column if not exists "JC-2.3 Further Studies Needed SCORE" text,
    add column if not exists "JC-2.4 Review & Summary SCORE" text,
    add column if not exists "JC-3.1 Preparation & Materials SCORE" text,
    add column if not exists "JC-3.2 Presentation Skills SCORE" text,
    add column if not exists "JC-3.3 Time Management SCORE" text,
    add column if not exists "JC-4.0 Ability to Answer Questions SCORE" text;

  alter table public."Assessment"
    add column if not exists "MSF-Continuous Prof. Development (C) SCORE" text,
    add column if not exists "MSF-Research & Innovation (R) SCORE" text,
    add column if not exists "MSF-Resilience (R) SCORE" text,
    add column if not exists "MSF-Altruism (A) SCORE" text,
    add column if not exists "MSF-Mastery (M) SCORE" text,
    add column if not exists "MSF-Digital Literacy (D) SCORE" text,
    add column if not exists "MSF-Professionalism (P) SCORE" text,
    add column if not exists "MSF-Humility & Volunteerism (H) SCORE" text;

  alter table public."Assessment"
    add column if not exists "CbD-Data Gathering & Presentation SCORE" text,
    add column if not exists "CbD-Problem Summarization SCORE" text,
    add column if not exists "CbD-Diagnosis & Diff Dx SCORE" text,
    add column if not exists "CbD-Investigations SCORE" text,
    add column if not exists "CbD-Management & Prevention SCORE" text,
    add column if not exists "CbD - Overall performance" text;

  alter table public."Assessment"
    add column if not exists "MiniCEX-History Taking SCORE" text,
    add column if not exists "MiniCEX-Physical Exam SCORE" text,
    add column if not exists "MiniCEX-Diagnosis & Diff Dx SCORE" text,
    add column if not exists "MiniCEX-Investigations SCORE" text,
    add column if not exists "MiniCEX-Management Plan SCORE" text,
    add column if not exists "MiniCEX-Patient Education/Counseling SCORE" text,
    add column if not exists "MiniCEX-Communication Skills SCORE" text,
    add column if not exists "MiniCEX-Professionalism SCORE" text,
    add column if not exists "MiniCEX - Over all performance" text;

  alter table public."Assessment"
    add column if not exists "IM Health Ed-Assess baseline SCORE" text,
    add column if not exists "IM Health Ed-Information delivery SCORE" text,
    add column if not exists "IM Health Ed-Teach-back and engagement SCORE" text,
    add column if not exists "IM Health Ed-Empowerment and shared planning SCORE" text,
    add column if not exists "IM Health Ed-Communication skills (patient) SCORE" text,
    add column if not exists "IM Health Ed-Professionalism checklist SCORE" text;

  alter table public."Assessment"
    add column if not exists "Case Presentation-Content and currency SCORE" text,
    add column if not exists "Case Presentation-Evidence appraisal SCORE" text,
    add column if not exists "Case Presentation-Clinical application SCORE" text,
    add column if not exists "Case Presentation-Teaching media SCORE" text,
    add column if not exists "Case Presentation-Presentation skills SCORE" text;

  alter table public."Assessment"
    add column if not exists "Interesting Case-Patient summary SCORE" text,
    add column if not exists "Interesting Case-Clinical diagnosis process SCORE" text,
    add column if not exists "Interesting Case-Management and holistic care SCORE" text,
    add column if not exists "Interesting Case-Discussion SCORE" text,
    add column if not exists "Interesting Case-Presentation media and delivery SCORE" text;

  alter table public."Assessment"
    add column if not exists "Interesting Case General-Patient summary SCORE" text,
    add column if not exists "Interesting Case General-Clinical diagnosis process SCORE" text,
    add column if not exists "Interesting Case General-Management and holistic care SCORE" text,
    add column if not exists "Interesting Case General-Discussion SCORE" text,
    add column if not exists "Interesting Case General-Presentation media and delivery SCORE" text;

  alter table public."Assessment"
    add column if not exists "OPD Assessment-History SCORE" text,
    add column if not exists "OPD Assessment-Physical examination SCORE" text,
    add column if not exists "OPD Assessment-Problem list SCORE" text,
    add column if not exists "OPD Assessment-Provisional diagnosis SCORE" text,
    add column if not exists "OPD Assessment-Differential diagnosis and discussion SCORE" text,
    add column if not exists "OPD Assessment-Investigation and interpretation SCORE" text,
    add column if not exists "OPD Assessment-Management plan SCORE" text,
    add column if not exists "OPD Assessment - Overall result" text;

alter table public."Assessment"
  add column if not exists "OPD Clinical-Foundation knowledge SCORE" text,
  add column if not exists "OPD Clinical-Clinical evaluation SCORE" text,
  add column if not exists "OPD Clinical-Clinical reasoning and planning SCORE" text,
  add column if not exists "OPD Clinical-Management and follow-up SCORE" text,
  add column if not exists "OPD Clinical-Communication skills SCORE" text,
  add column if not exists "OPD Clinical-Professionalism checklist SCORE" text,
  add column if not exists "OPD Clinical - Overall Performance" text;

alter table public."Assessment"
  add column if not exists "IPD Clinical-Clinical data and monitoring SCORE" text,
  add column if not exists "IPD Clinical-Case presentation (SOAP) SCORE" text,
  add column if not exists "IPD Clinical-Clinical reasoning and management SCORE" text,
  add column if not exists "IPD Clinical-Procedural skill SCORE" text,
  add column if not exists "IPD Clinical-Responsibility and punctuality SCORE" text,
  add column if not exists "IPD Clinical-Clinical initiative and learning SCORE" text,
  add column if not exists "IPD Clinical-Communication and interpersonal SCORE" text,
  add column if not exists "IPD Clinical-Ethics and professional conduct SCORE" text,
  add column if not exists "IPD Clinical - Overall Performance" text;

  alter table public."Assessment"
    add column if not exists "Anticipatory Guidance-History SCORE" text,
    add column if not exists "Anticipatory Guidance-Physical examination SCORE" text,
    add column if not exists "Anticipatory Guidance-Problem list SCORE" text,
    add column if not exists "Anticipatory Guidance-Management and anticipatory guidance SCORE" text,
    add column if not exists "Anticipatory Guidance - Overall result" text;

  alter table public."Assessment"
    add column if not exists "OR Assessment-Surgical patient data SCORE" text,
    add column if not exists "OR Assessment-Disease background SCORE" text,
    add column if not exists "OR Assessment-Surgical procedure knowledge SCORE" text,
    add column if not exists "OR Assessment-Sterile technique SCORE" text,
    add column if not exists "OR Assessment-Operative field participation SCORE" text,
    add column if not exists "OR Assessment-Professionalism checklist SCORE" text,
    add column if not exists "OR Assessment - Overall Performance" text;

  alter table public."Assessment"
    add column if not exists "Health Education Topic" text,
    add column if not exists "OBGYN Health Ed-Introduction SCORE" text,
    add column if not exists "OBGYN Health Ed-Foundation SCORE" text,
    add column if not exists "OBGYN Health Ed-Technical instructions SCORE" text,
    add column if not exists "OBGYN Health Ed-Lifestyle advice SCORE" text,
    add column if not exists "OBGYN Health Ed-Warning signs SCORE" text,
    add column if not exists "OBGYN Health Ed-Follow-up and questions SCORE" text,
    add column if not exists "OB/GYNE Health Education - Overall result" text;

  alter table public."Assessment"
    add column if not exists created_at timestamptz default now();
  alter table public."Assessment"
    add column if not exists updated_at timestamptz default now();

  -- ---------------------------------------------------------------------------
  -- DOPS logbook: optional per-skill rubric URL + Storage uploads + views
  -- (Requires public.skills — see supabase/rls-skills-logbook.sql if needed.)
  -- ---------------------------------------------------------------------------

  alter table if exists public.skills
    add column if not exists rubric_pdf_url text;

  comment on column public.skills.rubric_pdf_url is
    'Public URL to PDF rubric for this procedure; DOPS form resolves rubric from this when set.';

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

  create or replace view public.dops_skills_catalog as
  select
    s.skill,
    s."group",
    s.amount_required,
    s.enlisted_in_manual_skill,
    s.department,
    s.rubric_pdf_url
  from public.skills s
  order by s.skill;

  grant select on public.dops_skills_catalog to authenticated;

  create or replace view public.student_dops_logbook_progress as
  with student_profile as (
    select
      u."Student ID" as student_id
    from public."Users" u
    where lower(coalesce(u."Email", '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    limit 1
  ),
  dops_done as (
    select
      a."Student ID" as student_id,
      a."Procedure Name" as skill,
      count(*)::int as completed
    from public."Assessment" a
    where a."Form Type" = 'DOPS'
      and lower(coalesce(a."Status", '')) not like '%pending%'
      and lower(trim(coalesce(a."Status", ''))) <> 'fail'
    group by a."Student ID", a."Procedure Name"
  )
  select
    s.skill,
    s."group",
    s.amount_required,
    s.enlisted_in_manual_skill,
    coalesce(d.completed, 0)::int as completed,
    s.department,
    s.rubric_pdf_url
  from public.skills s
  cross join student_profile sp
  left join dops_done d
    on d.student_id = sp.student_id
   and d.skill = s.skill
  order by s.skill;

  grant select on public.student_dops_logbook_progress to authenticated;

  -- Optional seed: Pediatric UAC/UVC (harmless upsert).
  insert into public.skills (skill, "group", amount_required, enlisted_in_manual_skill, department, rubric_pdf_url)
  values (
    'UAC/UVC insertion',
    null,
    null,
    null,
    'Pediatrics',
    null
  )
  on conflict (skill) do update
  set department = excluded.department;

  -- Optional seed: Sx/Ortho/ER DOPS procedures + rubric links.
  insert into public.skills (skill, "group", amount_required, enlisted_in_manual_skill, department, rubric_pdf_url)
  values
    (
      'FAST in trauma patients',
      null,
      null,
      null,
      'Sx/Ortho/ER',
      '/rubrics/dops-sx-ortho-er/dops-fast-in-trauma-patients.pdf'
    ),
    (
      'Excision (surgery)',
      null,
      null,
      null,
      'Sx/Ortho/ER',
      '/rubrics/dops-sx-ortho-er/dops-excision-surgery.docx'
    ),
    (
      'Digital nerve block',
      null,
      null,
      null,
      'Sx/Ortho/ER',
      '/rubrics/dops-sx-ortho-er/dops-digital-nerve-block.pdf'
    ),
    (
      'Short arm slab',
      null,
      null,
      null,
      'Sx/Ortho/ER',
      '/rubrics/dops-sx-ortho-er/dops-short-arm-slab.pdf'
    ),
    (
      'Skin traction',
      null,
      null,
      null,
      'Sx/Ortho/ER',
      '/rubrics/dops-sx-ortho-er/dops-skin-traction.pdf'
    )
  on conflict (skill) do update
  set
    department = excluded.department,
    rubric_pdf_url = excluded.rubric_pdf_url;

  -- Optional seed: OB/GYN DOPS procedures + rubric links.
  insert into public.skills (skill, "group", amount_required, enlisted_in_manual_skill, department, rubric_pdf_url)
  values
    (
      'PAP smear',
      null,
      null,
      null,
      'OB/GYN',
      '/rubrics/dops-obgyn/dops-pap-smear.docx'
    ),
    (
      'Vaginal packing',
      null,
      null,
      null,
      'OB/GYN',
      '/rubrics/dops-obgyn/dops-vaginal-packing.docx'
    ),
    (
      'IUD insertion',
      null,
      null,
      null,
      'OB/GYN',
      '/rubrics/dops-obgyn/dops-iud-insertion.pdf'
    ),
    (
      'Contraceptive implant removal',
      null,
      null,
      null,
      'OB/GYN',
      '/rubrics/dops-obgyn/dops-contraceptive-implant-removal.pdf'
    )
  on conflict (skill) do update
  set
    department = excluded.department,
    rubric_pdf_url = excluded.rubric_pdf_url;
