-- Resolver recursão infinita nas políticas RLS da tabela usuarios
-- ETAPA 1: Criar função segura para verificar se usuário é comprador
CREATE OR REPLACE FUNCTION public.is_user_comprador_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'comprador'::app_role
  );
$$;

-- ETAPA 2: Remover TODAS as políticas problemáticas da tabela usuarios
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
DROP POLICY IF EXISTS "Masters can view all users" ON public.usuarios;
DROP POLICY IF EXISTS "Compradores podem ver outros compradores" ON public.usuarios;
DROP POLICY IF EXISTS "Users can edit own data or masters edit all" ON public.usuarios;
DROP POLICY IF EXISTS "Allow system to insert users" ON public.usuarios;
DROP POLICY IF EXISTS "Allow trigger to insert new users" ON public.usuarios;

-- ETAPA 3: Criar políticas ultra-simples sem recursão
-- Política básica: usuários veem próprios dados
CREATE POLICY "Users can view own data" 
ON public.usuarios 
FOR SELECT 
USING (id = auth.uid());

-- Política master: masters veem tudo usando função segura
CREATE POLICY "Masters can view all users" 
ON public.usuarios 
FOR SELECT 
USING (is_user_master_safe());

-- Política compradores: compradores veem outros compradores aprovados
CREATE POLICY "Compradores podem ver outros compradores" 
ON public.usuarios 
FOR SELECT 
USING (
  id = auth.uid() OR 
  is_user_master_safe() OR
  (is_user_comprador_safe() AND tipo = 'comprador' AND aprovado = true)
);

-- Política para edição: apenas próprios dados ou masters
CREATE POLICY "Users can edit own data or masters edit all" 
ON public.usuarios 
FOR ALL 
USING (
  id = auth.uid() OR 
  is_user_master_safe()
)
WITH CHECK (
  id = auth.uid() OR 
  is_user_master_safe()
);

-- Política para inserção via trigger
CREATE POLICY "Allow system to insert users" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (true);