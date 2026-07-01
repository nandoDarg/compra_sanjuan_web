-- Migration: feedback / suggestions table
-- Date: 2026-07-01

create table if not exists public.feedback (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  type       text        not null check (type in ('suggestion', 'problem', 'feature', 'other')),
  message    text        not null,
  anonimo    boolean     not null default true,
  user_id    uuid        references auth.users(id) on delete set null,
  nombre     text,
  email      text
);

alter table public.feedback enable row level security;

-- Cualquier visitante (anon o autenticado) puede insertar feedback
drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any"
on public.feedback for insert
to anon, authenticated
with check (true);

-- Lectura bloqueada para el cliente: solo el backend con service role puede leer
-- (no se crea politica de select -> denegado por defecto con RLS habilitado)

comment on table public.feedback is
'Sugerencias y reportes enviados por usuarios, con soporte para envio anonimo o identificado.';
