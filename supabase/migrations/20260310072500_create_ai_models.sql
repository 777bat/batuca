-- Creation of dynamic AI Models Registry Table
CREATE TABLE IF NOT EXISTS public.ai_models (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    model_id text NOT NULL UNIQUE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('image', 'audio', 'video')),
    cost integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    provider text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone
);

-- Turn on Row Level Security (good practice)
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated users can only READ models where is_active is TRUE
CREATE POLICY "Livre acesso de visualizacao para modelos ativos" ON public.ai_models
FOR SELECT
USING (is_active = true OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Admins get full CRUD (Create, Read, Update, Delete)
CREATE POLICY "Admins controle total dos modelos" ON public.ai_models
FOR ALL
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Seed existing models into the ecosystem automatically
INSERT INTO public.ai_models (model_id, name, type, cost, is_active, provider) VALUES
('flux-2/pro-text-to-image', 'FLUX 2 Pro (Texto para imagem)', 'image', 1, true, 'kie.ai'),
('nano-banana-pro', 'Nano Banana Pro (Exclusivo)', 'image', 1, true, 'kie.ai'),
('suno-v3.5', 'Suno v3.5', 'audio', 10, true, 'suno'),
('suno-v3', 'Suno v3', 'audio', 8, true, 'suno')
ON CONFLICT (model_id) DO NOTHING;
