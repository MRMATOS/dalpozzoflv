-- Permitir que compradores vejam pedidos uns dos outros
-- Atualizar políticas RLS para pedidos_compra
DROP POLICY IF EXISTS "Users can view own pedidos" ON public.pedidos_compra;

CREATE POLICY "Compradores podem ver pedidos entre si" 
ON public.pedidos_compra 
FOR SELECT 
USING (
  is_user_master() OR 
  user_id = auth.uid() OR
  (EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo = 'comprador' AND aprovado = true
  ) AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = pedidos_compra.user_id AND tipo = 'comprador' AND aprovado = true
  ))
);

-- Atualizar políticas RLS para pedidos_simples
DROP POLICY IF EXISTS "Users can view own pedidos_simples" ON public.pedidos_simples;

CREATE POLICY "Compradores podem ver pedidos simples entre si" 
ON public.pedidos_simples 
FOR SELECT 
USING (
  is_user_master() OR 
  user_id = auth.uid() OR
  (EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo = 'comprador' AND aprovado = true
  ) AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = pedidos_simples.user_id AND tipo = 'comprador' AND aprovado = true
  ))
);

-- Permitir que compradores vejam informações básicas de outros compradores
DROP POLICY IF EXISTS "Users can view own data or masters view all" ON public.usuarios;

CREATE POLICY "Compradores podem ver dados básicos entre si" 
ON public.usuarios 
FOR SELECT 
USING (
  is_user_master() OR 
  id = auth.uid() OR
  (EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo = 'comprador' AND aprovado = true
  ) AND tipo = 'comprador' AND aprovado = true)
);