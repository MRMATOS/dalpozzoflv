-- Atualizar política RLS para permitir inserção por usuários autenticados
DROP POLICY IF EXISTS "Masters can manage sinonimos" ON public.sinonimos_produto;

-- Nova política mais permissiva para migração
CREATE POLICY "Masters can manage sinonimos" ON public.sinonimos_produto
FOR ALL USING (is_user_master());

CREATE POLICY "Authenticated users can insert sinonimos for migration" ON public.sinonimos_produto
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);