-- Atualizar política RLS da tabela fornecedores para permitir que compradores criem fornecedores
DROP POLICY IF EXISTS "Enhanced fornecedor management" ON public.fornecedores;

-- Nova política que permite compradores criarem e editarem fornecedores
CREATE POLICY "Compradores podem gerenciar fornecedores" 
ON public.fornecedores 
FOR ALL 
USING (
  is_user_master() OR 
  (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'master'::app_role
  )) OR
  (EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo IN ('master', 'comprador') AND aprovado = true
  ))
)
WITH CHECK (
  is_user_master() OR 
  (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'master'::app_role
  )) OR
  (EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo IN ('master', 'comprador') AND aprovado = true
  ))
);