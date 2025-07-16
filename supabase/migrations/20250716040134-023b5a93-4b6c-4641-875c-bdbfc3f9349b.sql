-- Corrigir inconsistência entre tabelas usuarios e user_roles
-- Atualizar role para 'comprador' onde usuario tem tipo = 'comprador'

UPDATE public.user_roles 
SET role = 'comprador'::app_role 
WHERE user_id IN (
  SELECT id FROM public.usuarios 
  WHERE tipo = 'comprador' AND aprovado = true
);