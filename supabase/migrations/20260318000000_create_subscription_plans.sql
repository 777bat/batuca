-- Create subscription_plans table
create table public.subscription_plans (
  id uuid default extensions.uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null default 0,
  credits integer not null default 0,
  stripe_price_id text,
  is_popular boolean default false,
  features text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone
);

-- Enable RLS
alter table public.subscription_plans enable row level security;

-- Policies
create policy "Plans are viewable by everyone" on subscription_plans
  for select using (true);

create policy "Plans are manageable by admins only" on subscription_plans
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Trigger for updated_at
create trigger handle_updated_at_subscription_plans before update on subscription_plans
  for each row execute procedure moddatetime (updated_at);

-- Insert default plans
insert into public.subscription_plans (name, description, price, credits, is_popular, features)
values 
('Free', 'Ideal for getting started with AI media generation.', 0, 10, false, '{"10 Generations / day", "Standard Resolution"}'),
('Pro', 'Perfect for creators and small studios.', 49, 1000, true, '{"Unlimited Generations", "4K Ultra-HD Export", "Commercial Rights", "Priority Processing"}'),
('Enterprise', 'Scale your production with dedicated resources.', 0, 5000, false, '{"API Access", "Dedicated GPU Nodes", "Custom Model Tuning", "Multi-user Controls"}');
