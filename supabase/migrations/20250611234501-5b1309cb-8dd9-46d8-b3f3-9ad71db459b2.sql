
-- Habilitar RLS em todas as tabelas que não têm proteção
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_cotacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_requisicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_cotacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_exposicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escala_abastecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinonimos_produto ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar se é usuário master
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'master')
$$;

-- Políticas para tabela cotacoes
CREATE POLICY "Users can view their own cotacoes" 
  ON public.cotacoes 
  FOR SELECT 
  USING (user_id = auth.uid() OR public.is_master_user());

CREATE POLICY "Users can create their own cotacoes" 
  ON public.cotacoes 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cotacoes" 
  ON public.cotacoes 
  FOR UPDATE 
  USING (user_id = auth.uid() OR public.is_master_user());

CREATE POLICY "Users can delete their own cotacoes" 
  ON public.cotacoes 
  FOR DELETE 
  USING (user_id = auth.uid() OR public.is_master_user());

-- Políticas para tabela pedidos_compra
CREATE POLICY "Users can view their own pedidos" 
  ON public.pedidos_compra 
  FOR SELECT 
  USING (user_id = auth.uid() OR public.is_master_user());

CREATE POLICY "Users can create their own pedidos" 
  ON public.pedidos_compra 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pedidos" 
  ON public.pedidos_compra 
  FOR UPDATE 
  USING (user_id = auth.uid() OR public.is_master_user());

-- Políticas para itens_pedido (baseado no pedido pai)
CREATE POLICY "Users can view itens of their pedidos" 
  ON public.itens_pedido 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos_compra 
      WHERE id = pedido_id 
      AND (user_id = auth.uid() OR public.is_master_user())
    )
  );

CREATE POLICY "Users can create itens for their pedidos" 
  ON public.itens_pedido 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos_compra 
      WHERE id = pedido_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update itens of their pedidos" 
  ON public.itens_pedido 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos_compra 
      WHERE id = pedido_id 
      AND (user_id = auth.uid() OR public.is_master_user())
    )
  );

-- Políticas para itens_cotacao (baseado na cotação pai)
CREATE POLICY "Users can view itens of their cotacoes" 
  ON public.itens_cotacao 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.cotacoes 
      WHERE id = cotacao_id 
      AND (user_id = auth.uid() OR public.is_master_user())
    )
  );

CREATE POLICY "Users can create itens for their cotacoes" 
  ON public.itens_cotacao 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cotacoes 
      WHERE id = cotacao_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update itens of their cotacoes" 
  ON public.itens_cotacao 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.cotacoes 
      WHERE id = cotacao_id 
      AND (user_id = auth.uid() OR public.is_master_user())
    )
  );

-- Políticas para itens_requisicao (baseado na requisição pai)
CREATE POLICY "Users can view itens of accessible requisicoes" 
  ON public.itens_requisicao 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.requisicoes 
      WHERE id = requisicao_id 
      AND (user_id = auth.uid() OR public.is_master_user())
    )
  );

CREATE POLICY "Users can create itens for their requisicoes" 
  ON public.itens_requisicao 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requisicoes 
      WHERE id = requisicao_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update itens of accessible requisicoes" 
  ON public.itens_requisicao 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.requisicoes 
      WHERE id = requisicao_id 
      AND (user_id = auth.uid() OR public.is_master_user())
    )
  );

-- Função para obter loja do usuário
CREATE OR REPLACE FUNCTION public.get_user_loja()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT loja FROM public.profiles WHERE id = auth.uid()
$$;

-- Políticas para estoque_atual (baseado na loja do usuário)
CREATE POLICY "Users can view estoque of their loja" 
  ON public.estoque_atual 
  FOR SELECT 
  USING (loja = public.get_user_loja() OR public.is_master_user());

CREATE POLICY "Users can create estoque for their loja" 
  ON public.estoque_atual 
  FOR INSERT 
  WITH CHECK (loja = public.get_user_loja() OR public.is_master_user());

CREATE POLICY "Users can update estoque of their loja" 
  ON public.estoque_atual 
  FOR UPDATE 
  USING (loja = public.get_user_loja() OR public.is_master_user());

-- Políticas para estoque_cotacao (baseado na loja do usuário)
CREATE POLICY "Users can view estoque_cotacao of their loja" 
  ON public.estoque_cotacao 
  FOR SELECT 
  USING (loja = public.get_user_loja() OR public.is_master_user());

CREATE POLICY "Users can create estoque_cotacao for their loja" 
  ON public.estoque_cotacao 
  FOR INSERT 
  WITH CHECK (loja = public.get_user_loja() OR public.is_master_user());

CREATE POLICY "Users can update estoque_cotacao of their loja" 
  ON public.estoque_cotacao 
  FOR UPDATE 
  USING (loja = public.get_user_loja() OR public.is_master_user());

-- Políticas para transferencias (usuários podem ver transferências de/para sua loja)
CREATE POLICY "Users can view transferencias of their loja" 
  ON public.transferencias 
  FOR SELECT 
  USING (
    loja_origem = public.get_user_loja() 
    OR loja_destino = public.get_user_loja() 
    OR public.is_master_user()
  );

CREATE POLICY "Users can create transferencias from their loja" 
  ON public.transferencias 
  FOR INSERT 
  WITH CHECK (
    loja_origem = public.get_user_loja() 
    OR public.is_master_user()
  );

CREATE POLICY "Users can update transferencias of their loja" 
  ON public.transferencias 
  FOR UPDATE 
  USING (
    loja_origem = public.get_user_loja() 
    OR loja_destino = public.get_user_loja() 
    OR public.is_master_user()
  );

-- Políticas para areas_exposicao (baseado na loja)
CREATE POLICY "Users can view areas of their loja" 
  ON public.areas_exposicao 
  FOR SELECT 
  USING (loja = public.get_user_loja() OR public.is_master_user());

CREATE POLICY "Master can manage areas" 
  ON public.areas_exposicao 
  FOR ALL 
  USING (public.is_master_user());

-- Políticas para escala_abastecimento (master e compradores podem ver)
CREATE POLICY "Compradores and master can view escala" 
  ON public.escala_abastecimento 
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'comprador') 
    OR public.is_master_user()
  );

CREATE POLICY "Master can manage escala" 
  ON public.escala_abastecimento 
  FOR ALL 
  USING (public.is_master_user());

-- Políticas para sinonimos_produto (master pode gerenciar, outros podem ver)
CREATE POLICY "All users can view sinonimos" 
  ON public.sinonimos_produto 
  FOR SELECT 
  USING (true);

CREATE POLICY "Master can manage sinonimos" 
  ON public.sinonimos_produto 
  FOR ALL 
  USING (public.is_master_user());

-- Corrigir política hardcoded na tabela usuarios
DROP POLICY IF EXISTS "Only specific user can manage usuarios" ON public.usuarios;

CREATE POLICY "Master can manage usuarios" 
  ON public.usuarios 
  FOR ALL 
  USING (public.is_master_user());

CREATE POLICY "Users can view basic usuario info" 
  ON public.usuarios 
  FOR SELECT 
  USING (true);

-- Políticas para produtos (todos podem ver, master pode gerenciar)
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view produtos" 
  ON public.produtos 
  FOR SELECT 
  USING (true);

CREATE POLICY "Master can manage produtos" 
  ON public.produtos 
  FOR ALL 
  USING (public.is_master_user());

-- Políticas para fornecedores (todos podem ver, master pode gerenciar)
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view fornecedores" 
  ON public.fornecedores 
  FOR SELECT 
  USING (true);

CREATE POLICY "Master can manage fornecedores" 
  ON public.fornecedores 
  FOR ALL 
  USING (public.is_master_user());

-- Políticas para lojas (todos podem ver, master pode gerenciar)
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view lojas" 
  ON public.lojas 
  FOR SELECT 
  USING (true);

CREATE POLICY "Master can manage lojas" 
  ON public.lojas 
  FOR ALL 
  USING (public.is_master_user());

-- Políticas para requisicoes (usuários podem ver requisições da sua loja e suas próprias)
ALTER TABLE public.requisicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requisicoes of their loja" 
  ON public.requisicoes 
  FOR SELECT 
  USING (
    loja = public.get_user_loja() 
    OR user_id = auth.uid() 
    OR public.is_master_user()
  );

CREATE POLICY "Users can create requisicoes for their loja" 
  ON public.requisicoes 
  FOR INSERT 
  WITH CHECK (
    loja = public.get_user_loja() 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own requisicoes" 
  ON public.requisicoes 
  FOR UPDATE 
  USING (
    user_id = auth.uid() 
    OR public.is_master_user()
  );
