
-- Corrigir políticas de INSERT sem dropar a função get_user_loja
-- Primeiro, criar a nova versão da função get_user_loja
CREATE OR REPLACE FUNCTION public.get_user_loja()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT loja FROM public.usuarios WHERE id = auth.uid()
$$;

-- Criar função para verificar se usuário existe na tabela usuarios
CREATE OR REPLACE FUNCTION public.user_exists_in_usuarios()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios WHERE id = auth.uid()
  )
$$;

-- Atualizar função is_master_user para trabalhar com tabela usuarios
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo = 'master'
  )
$$;

-- Corrigir política de INSERT para cotacoes
DROP POLICY IF EXISTS "Users can create their own cotacoes" ON public.cotacoes;
CREATE POLICY "Users can create their own cotacoes" 
  ON public.cotacoes 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Corrigir política de INSERT para pedidos_compra  
DROP POLICY IF EXISTS "Users can create their own pedidos" ON public.pedidos_compra;
CREATE POLICY "Users can create their own pedidos" 
  ON public.pedidos_compra 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Atualizar política de INSERT para estoque_atual (mantendo a existente mas corrigindo)
DROP POLICY IF EXISTS "Users can create estoque for their loja" ON public.estoque_atual;
CREATE POLICY "Users can create estoque for their loja" 
  ON public.estoque_atual 
  FOR INSERT 
  WITH CHECK (loja = public.get_user_loja() OR public.is_master_user());
