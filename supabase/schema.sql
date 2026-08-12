-- ============================================================
-- Öğrenci Koçluk Takip — Supabase şema dosyası
-- Bunu Supabase Dashboard > SQL Editor içine yapıştırıp çalıştır.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
-- Hem koç hem öğrenci hesapları burada tutulur.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('coach','student')),
  name text not null,
  hedef text,
  coach_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_self_select" on profiles;
create policy "profiles_self_select" on profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_coach_select_students" on profiles;
create policy "profiles_coach_select_students" on profiles
  for select using (coach_id = auth.uid());

drop policy if exists "profiles_self_insert" on profiles;
create policy "profiles_self_insert" on profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles
  for update using (id = auth.uid());

-- ---------- invites ----------
-- Koç, öğrenci eklerken bir davet kodu üretir; öğrenci kayıt olurken bu kodu girer.
create table if not exists invites (
  code text primary key,
  coach_id uuid not null references profiles(id) on delete cascade,
  student_name text not null,
  hedef text,
  used boolean not null default false,
  created_at timestamptz default now()
);

alter table invites enable row level security;

drop policy if exists "invites_coach_manage" on invites;
create policy "invites_coach_manage" on invites
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- ---------- study_sessions ----------
create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  subject text not null,
  minutes int not null,
  note text,
  created_at timestamptz default now()
);
alter table study_sessions enable row level security;

drop policy if exists "study_sessions_own" on study_sessions;
create policy "study_sessions_own" on study_sessions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "study_sessions_coach_read" on study_sessions;
create policy "study_sessions_coach_read" on study_sessions
  for select using (exists (
    select 1 from profiles p where p.id = study_sessions.student_id and p.coach_id = auth.uid()
  ));

-- ---------- exam_results ----------
create table if not exists exam_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  exam_name text not null,
  subject text not null,
  dogru int not null default 0,
  yanlis int not null default 0,
  net numeric not null,
  created_at timestamptz default now()
);
alter table exam_results enable row level security;

drop policy if exists "exam_results_own" on exam_results;
create policy "exam_results_own" on exam_results
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "exam_results_coach_read" on exam_results;
create policy "exam_results_coach_read" on exam_results
  for select using (exists (
    select 1 from profiles p where p.id = exam_results.student_id and p.coach_id = auth.uid()
  ));

-- ---------- goals ----------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  due date,
  done boolean not null default false,
  created_at timestamptz default now()
);
alter table goals enable row level security;

drop policy if exists "goals_own" on goals;
create policy "goals_own" on goals
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "goals_coach_read" on goals;
create policy "goals_coach_read" on goals
  for select using (exists (
    select 1 from profiles p where p.id = goals.student_id and p.coach_id = auth.uid()
  ));

-- ---------- notes ----------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  mood text not null,
  text text not null,
  created_at timestamptz default now()
);
alter table notes enable row level security;

drop policy if exists "notes_own" on notes;
create policy "notes_own" on notes
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "notes_coach_read" on notes;
create policy "notes_coach_read" on notes
  for select using (exists (
    select 1 from profiles p where p.id = notes.student_id and p.coach_id = auth.uid()
  ));

-- ---------- davet kodu kullanma fonksiyonu ----------
-- Öğrenci auth hesabı açtıktan (signUp) sonra bu fonksiyonu çağırır.
-- Kod geçerliyse kendi profilini oluşturur ve kodu "kullanıldı" işaretler.
create or replace function public.redeem_invite(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
begin
  select * into v_invite from invites where code = p_code and used = false;

  if not found then
    raise exception 'Geçersiz veya daha önce kullanılmış davet kodu';
  end if;

  insert into profiles (id, role, name, hedef, coach_id)
  values (auth.uid(), 'student', v_invite.student_name, v_invite.hedef, v_invite.coach_id);

  update invites set used = true where code = p_code;
end;
$$;

grant execute on function public.redeem_invite(text) to authenticated;
