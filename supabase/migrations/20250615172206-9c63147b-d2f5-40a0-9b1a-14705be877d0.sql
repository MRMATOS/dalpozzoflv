
-- Função para verificar se o usuário é comprador ou master
CREATE OR REPLACE FUNCTION public.is_comprador_or_master()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND (tipo = 'master' OR tipo = 'comprador')
  )
$$;

-- Garante que a RLS está habilitada na tabela de estoque
ALTER TABLE public.estoque_atual ENABLE ROW LEVEL SECURITY;

-- Remove as políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can view estoque of their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can create estoque for their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can update estoque of their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Master users can delete estoque" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can view stock" ON public.estoque_atual;

-- Cria as novas políticas de segurança para a tabela estoque_atual

-- Política de LEITURA: Compradores e master veem todas as lojas. Outros usuários veem apenas sua própria loja.
CREATE POLICY "Users can view stock"
  ON public.estoque_atual
  FOR SELECT
  USING (
    public.is_comprador_or_master() OR loja = public.get_user_loja()
  );

-- Política de INSERÇÃO: Usuários podem inserir estoque apenas para sua loja. Master pode inserir para qualquer loja.
CREATE POLICY "Users can create estoque for their loja"
  ON public.estoque_atual
  FOR INSERT
  WITH CHECK (loja = public.get_user_loja() OR public.is_master_user());

-- Política de ATUALIZAÇÃO: Usuários podem atualizar estoque apenas da sua loja. Master pode atualizar de qualquer loja.
CREATE POLICY "Users can update estoque of their loja"
  ON public.estoque_atual
  FOR UPDATE
  USING (loja = public.get_user_loja() OR public.is_master_user());

-- Política de DELEÇÃO: Apenas 'master' pode deletar registros de estoque.
CREATE POLICY "Master users can delete estoque"
  ON public.estoque_atual
  FOR DELETE
  USING (public.is_master_user());

-- Adiciona índices para otimizar a performance das consultas de estoque
CREATE INDEX IF NOT EXISTS idx_estoque_atual_loja ON public.estoque_atual(loja);
CREATE INDEX IF NOT EXISTS idx_estoque_atual_produto_loja ON public.estoque_atual(produto_id, loja);
