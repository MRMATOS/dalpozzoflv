
-- Habilitar RLS na tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar produtos" 
ON public.produtos 
FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir INSERT para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar produtos" 
ON public.produtos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir UPDATE para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar produtos" 
ON public.produtos 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Política para permitir DELETE para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar produtos" 
ON public.produtos 
FOR DELETE 
TO authenticated 
USING (true);

-- Configurar realtime para a tabela produtos
ALTER TABLE public.produtos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;

-- Configurar realtime para a tabela estoque_atual também
ALTER TABLE public.estoque_atual REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque_atual;
