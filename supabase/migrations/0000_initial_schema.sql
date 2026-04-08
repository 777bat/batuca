-- Habilite extensões de UUID se necessário
create extension if not exists "uuid-ossp" with schema extensions;

-- Tabela Profiles (Perfis dos Usuários)
-- Fica atrelada automaticamente à tabela auth.users pelo ID
create table public.profiles (
  id uuid references auth.users(id) not null primary key,
  full_name text,
  avatar_url text,
  credits integer default 50, -- Créditos iniciais para os usuários novos
  subscription_tier text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone
);

-- Habilitar Políticas de Segurança em Nível de Linha (RLS) - Profiles
alter table public.profiles enable row level security;

-- Política: Usuários podem ver seus próprios perfis
create policy "Usuários podem visualizar o próprio perfil" on profiles
  for select using (auth.uid() = id);

-- Política: Usuários podem atualizar seus próprios perfis
create policy "Usuários podem atualizar o próprio perfil" on profiles
  for update using (auth.uid() = id);

-- Tabela Generations (Histórico de Imagem/Vídeo/Áudio)
create table public.generations (
  id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null check (type in ('image', 'video', 'audio')),
  prompt text not null,
  negative_prompt text,
  model text not null,
  parameters jsonb, -- Parâmetros extras como aspect ratio, etc.
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  result_url text, -- O link da imagem, vídeo ou música finalizada
  cost integer not null default 1, -- Quanto custou gerar
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Habilitar Políticas de Segurança em Nível de Linha (RLS) - Generations
alter table public.generations enable row level security;

-- Política: Usuários podem ver apenas suas próprias gerações
create policy "Usuários podem visualizar suas próprias gerações" on generations
  for select using (auth.uid() = user_id);

-- Política: Usuários podem inserir (criar) novas gerações
create policy "Usuários podem criar suas próprias gerações" on generations
  for insert with check (auth.uid() = user_id);

-- ==========================================================
-- Triggers e Funções Auxiliares
-- ==========================================================

-- Trigger para atualizar automaticamente o updated_at no Profiles
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at_profiles before update on profiles
  for each row execute procedure moddatetime (updated_at);

-- Função e Trigger para criar o Profile automaticamente quando o usuário se cadastra no Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, credits)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    50   -- Distribuição de 50 créditos grátis iniciais
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- O Trigger propriamente dito
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
