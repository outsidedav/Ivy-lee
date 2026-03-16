-- Add configurable max tasks per day to users
ALTER TABLE public.users
  ADD COLUMN max_tasks_per_day smallint NOT NULL DEFAULT 6
  CONSTRAINT users_max_tasks_check CHECK (max_tasks_per_day BETWEEN 1 AND 10);

-- Widen priority constraint to support up to 10 tasks
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_priority_check CHECK (priority BETWEEN 1 AND 10);
