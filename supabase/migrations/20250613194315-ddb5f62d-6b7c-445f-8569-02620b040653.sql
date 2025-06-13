
-- Fase 1: Correções Críticas

-- 1. Adicionar constraint única para estoque_atual
ALTER TABLE public.estoque_atual 
ADD CONSTRAINT estoque_atual_produto_loja_unique 
UNIQUE (produto_id, loja);

-- 2. Corrigir função get_user_loja para usar tabela usuarios ao invés de profiles
CREATE OR REPLACE FUNCTION public.get_user_loja()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT loja FROM public.usuarios WHERE id = auth.uid()
$$;

-- 3. Corrigir políticas RLS para pedidos_compra que estavam bloqueando inserções
DROP POLICY IF EXISTS "Users can create their own pedidos" ON public.pedidos_compra;

CREATE POLICY "Users can create their own pedidos" 
  ON public.pedidos_compra 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR public.is_master_user());

-- 4. Corrigir políticas RLS para estoque_atual que estavam bloqueando inserções
DROP POLICY IF EXISTS "Users can create estoque for their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can update estoque of their loja" ON public.estoque_atual;

CREATE POLICY "Users can create estoque for their loja" 
  ON public.estoque_atual 
  FOR INSERT 
  WITH CHECK (loja = public.get_user_loja() OR public.is_master_user());

CREATE POLICY "Users can update estoque of their loja" 
  ON public.estoque_atual 
  FOR UPDATE 
  USING (loja = public.get_user_loja() OR public.is_master_user());

-- 5. Adicionar política de UPSERT para estoque_atual
CREATE POLICY "Users can upsert estoque for their loja" 
  ON public.estoque_atual 
  FOR ALL 
  USING (loja = public.get_user_loja() OR public.is_master_user())
  WITH CHECK (loja = public.get_user_loja() OR public.is_master_user());
