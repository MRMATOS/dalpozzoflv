
-- CORREÇÃO DAS POLÍTICAS RLS PARA ITENS_PEDIDO
-- Permitir que compradores vejam itens de pedidos de outros compradores

-- 1. REMOVER POLÍTICAS RESTRITIVAS ATUAIS
DROP POLICY IF EXISTS "Users can view itens_pedido" ON public.itens_pedido;
DROP POLICY IF EXISTS "Users can manage itens_pedido" ON public.itens_pedido;

-- 2. CRIAR POLÍTICA DE SELECT MAIS PERMISSIVA (seguindo lógica de pedidos_compra)
CREATE POLICY "Compradores podem ver itens de pedidos entre si" 
ON public.itens_pedido 
FOR SELECT 
USING (
  is_user_master() OR 
  -- Próprios pedidos
  (EXISTS (
    SELECT 1 FROM pedidos_compra 
    WHERE pedidos_compra.id = itens_pedido.pedido_id 
    AND pedidos_compra.user_id = auth.uid()
  )) OR
  -- NOVO: Pedidos de outros compradores (se ambos são compradores aprovados)
  (EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo = 'comprador' AND aprovado = true
  ) AND EXISTS (
    SELECT 1 FROM pedidos_compra pc
    JOIN usuarios u ON u.id = pc.user_id
    WHERE pc.id = itens_pedido.pedido_id 
    AND u.tipo = 'comprador' 
    AND u.aprovado = true
  ))
);

-- 3. CRIAR POLÍTICA DE OPERAÇÕES (INSERT/UPDATE/DELETE) - Mantém segurança
CREATE POLICY "Compradores podem gerenciar itens de seus próprios pedidos" 
ON public.itens_pedido 
FOR ALL 
USING (
  is_user_master() OR 
  (EXISTS (
    SELECT 1 FROM pedidos_compra 
    WHERE pedidos_compra.id = itens_pedido.pedido_id 
    AND pedidos_compra.user_id = auth.uid()
  ))
)
WITH CHECK (
  is_user_master() OR 
  (EXISTS (
    SELECT 1 FROM pedidos_compra 
    WHERE pedidos_compra.id = itens_pedido.pedido_id 
    AND pedidos_compra.user_id = auth.uid()
  ))
);
