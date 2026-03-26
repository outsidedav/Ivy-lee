-- Add setting to allow adding tasks directly to Today
ALTER TABLE public.users
  ADD COLUMN allow_today_add boolean NOT NULL DEFAULT false;
