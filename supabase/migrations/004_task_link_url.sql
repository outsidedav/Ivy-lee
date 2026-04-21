-- Add optional URL attachment to tasks
ALTER TABLE public.tasks
  ADD COLUMN link_url text;
