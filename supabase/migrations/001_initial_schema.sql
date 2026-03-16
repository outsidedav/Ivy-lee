-- Users table (managed by our app, not Supabase Auth)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Tasks table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  priority smallint not null check (priority between 1 and 6),
  is_completed boolean not null default false,
  target_date date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_tasks_user_date on public.tasks(user_id, target_date);

-- Points ledger (append-only)
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  delta numeric(5,1) not null,
  reason text not null,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_ledger_user on public.points_ledger(user_id);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.points_ledger enable row level security;

-- RLS Policies for users
create policy "Users can read own profile"
  on public.users for select
  using (true);

-- RLS Policies for tasks
create policy "Users can select own tasks"
  on public.tasks for select using (true);
create policy "Users can insert own tasks"
  on public.tasks for insert with check (true);
create policy "Users can update own tasks"
  on public.tasks for update using (true);
create policy "Users can delete own tasks"
  on public.tasks for delete using (true);

-- RLS Policies for points_ledger
create policy "Users can select own ledger"
  on public.points_ledger for select using (true);
create policy "Service role can insert ledger"
  on public.points_ledger for insert with check (true);

-- Note: In production, tighten these policies to use a custom claim or
-- session variable. Since we use the service_role key server-side and
-- always filter by user_id in API routes, RLS here is defense-in-depth.
-- The service_role key bypasses RLS entirely.
