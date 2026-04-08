-- Adiciona a coluna 'role' para implementar permissões administrativas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Atualiza os RLS (Row Level Security) da tabela profiles para permitir que admins modifiquem outros perfis (ex: dar/tirar créditos)
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON public.profiles;

CREATE POLICY "Permite que donos atualizem seu perfil ou admins atualizem qualquer perfil" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
