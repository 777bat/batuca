-- Add new Suno V4_5ALL, V5, and V5_5 models and deactivate legacy ones
UPDATE public.ai_models SET is_active = false WHERE model_id IN ('suno-v3', 'suno-v3.5');

INSERT INTO public.ai_models (model_id, name, type, cost, is_active, provider) VALUES
('V4_5ALL', 'Suno V4.5 ALL (Estrutura melhor, ate 8min)', 'audio', 5, true, 'suno'),
('V5', 'Suno V5 (Expressao superior, mais rapido)', 'audio', 8, true, 'suno'),
('V5_5', 'Suno V5.5 (Modelos customizados, voz unica)', 'audio', 10, true, 'suno')
ON CONFLICT (model_id) DO UPDATE SET
    name = EXCLUDED.name,
    cost = EXCLUDED.cost,
    is_active = EXCLUDED.is_active,
    provider = EXCLUDED.provider,
    updated_at = now();
