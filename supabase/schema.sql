-- ============================================
-- ENCUESTAS CAU - Schema Supabase (Postgres)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================

-- 1. Tabla perfiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  role text not null check (role in ('admin','operador')),
  activo boolean default true,
  created_at timestamptz default now()
);

-- 2. Tabla encuestas
create table if not exists public.encuestas (
  id uuid primary key default gen_random_uuid(),
  chat_nombre text not null, -- ej: CAU, CAU-1, etc.
  fecha date not null, -- 31/8/2026 -> 2026-08-31
  hora time not null, -- 09:15
  valoracion smallint not null check (valoracion between 1 and 5),
  observaciones text, -- campo opcional por encuesta (ej: cliente enfadado, incidencia...)
  operador_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  -- DEDUPLICACIÓN: mismo chat + fecha + hora no puede repetirse (global)
  -- Si quieres deduplicación por operador, cambia a: unique (operador_id, fecha, hora, chat_nombre)
  unique (chat_nombre, fecha, hora)
);

-- Migración: si ya tenías tabla sin observaciones, ejecuta:
-- alter table public.encuestas add column if not exists observaciones text;

-- Índices para filtros e informes
create index if not exists idx_encuestas_fecha on public.encuestas(fecha);
create index if not exists idx_encuestas_operador on public.encuestas(operador_id);
create index if not exists idx_encuestas_valoracion on public.encuestas(valoracion);

-- 3. Habilitar RLS
alter table public.profiles enable row level security;
alter table public.encuestas enable row level security;

-- 4. Políticas RLS

-- Profiles: todos autenticados pueden leer perfiles, solo admin puede modificar
create policy "profiles_select_all_authenticated"
on public.profiles for select to authenticated using (true);

create policy "profiles_insert_own"
on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_admin_or_own"
on public.profiles for update to authenticated
using (
  auth.uid() = id 
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Encuestas: operador ve solo las suyas, admin ve todas
create policy "encuestas_select_own_or_admin"
on public.encuestas for select to authenticated
using (
  operador_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "encuestas_insert_authenticated"
on public.encuestas for insert to authenticated
with check (operador_id = auth.uid());

create policy "encuestas_delete_admin_or_owner"
on public.encuestas for delete to authenticated
using (
  operador_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "encuestas_update_own_or_admin"
on public.encuestas for update to authenticated
using (
  operador_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  operador_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 5. Trigger auto-crear profile al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'role','operador'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Vista para dashboard admin (opcional)
create or replace view public.v_resumen_operador as
select
  p.id as operador_id,
  p.nombre,
  p.email,
  count(e.id) as total_encuestas,
  round(avg(e.valoracion)::numeric,2) as media,
  count(*) filter (where e.valoracion = 5) as total_5,
  count(*) filter (where e.valoracion = 1) as total_1
from public.profiles p
left join public.encuestas e on e.operador_id = p.id
where p.role = 'operador'
group by p.id, p.nombre, p.email;
