-- Optional: add a uuid primary key if your Assessment table has no `id` column.
-- The app also recognizes `Assessment ID` / `assessment_id` if you prefer those names only.

alter table public."Assessment"
  add column if not exists id uuid default gen_random_uuid();

update public."Assessment"
set id = gen_random_uuid()
where id is null;

-- If the table has no primary key yet, you can run (only when no conflicting PK exists):
-- alter table public."Assessment" add primary key (id);
