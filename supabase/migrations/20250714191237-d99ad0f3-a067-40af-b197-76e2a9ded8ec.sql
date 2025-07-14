-- Permitir que usuários excluam seus próprios pedidos simples
CREATE POLICY "Users can delete own pedidos_simples" 
ON public.pedidos_simples 
FOR DELETE 
USING (user_id = auth.uid());