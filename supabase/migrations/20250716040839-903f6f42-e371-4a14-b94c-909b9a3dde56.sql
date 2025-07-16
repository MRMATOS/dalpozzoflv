-- Corrigir política RLS para compradores verem outros compradores no dropdown
-- Remover política complexa atual
DROP POLICY IF EXISTS "Compradores podem ver compradores" ON public.usuarios;

-- Criar política mais simples e direta
CREATE POLICY "Compradores podem ver outros compradores" 
ON public.usuarios 
FOR SELECT 
USING (
  id = auth.uid() OR 
  is_user_master_safe() OR
  (
    EXISTS (
      SELECT 1 FROM public.usuarios u1 
      WHERE u1.id = auth.uid() AND u1.tipo = 'comprador' AND u1.aprovado = true
    ) AND 
    tipo = 'comprador' AND aprovado = true
  )
);