-- Adiciona task_id a tabela generations
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS task_id text;
