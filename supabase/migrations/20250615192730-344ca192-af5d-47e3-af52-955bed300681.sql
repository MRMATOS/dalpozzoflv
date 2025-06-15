
-- Corrigir política de INSERT para pedidos_compra
DROP POLICY IF EXISTS "Users can create their own pedidos" ON public.pedidos_compra;
CREATE POLICY "Users can create their own pedidos" 
  ON public.pedidos_compra 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR public.is_master_user());

-- Corrigir política de INSERT para itens_pedido
DROP POLICY IF EXISTS "Users can create itens for their pedidos" ON public.itens_pedido;
CREATE POLICY "Users can create itens for their pedidos" 
  ON public.itens_pedido 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos_compra 
      WHERE id = pedido_id 
      AND (user_id = auth.uid() OR public.is_master_user())
    )
  );
