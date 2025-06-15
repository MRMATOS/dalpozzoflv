
-- Remover as políticas de segurança existentes na tabela estoque_atual
DROP POLICY IF EXISTS "Users can view stock" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can create estoque for their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can update estoque of their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Master users can delete estoque" ON public.estoque_atual;

-- Desabilitar temporariamente o Row Level Security (RLS) para testes
ALTER TABLE public.estoque_atual DISABLE ROW LEVEL SECURITY;
