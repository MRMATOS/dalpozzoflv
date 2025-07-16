-- Corrigir recursão infinita nas políticas RLS da tabela usuarios
-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Compradores podem ver dados básicos entre si" ON public.usuarios;
DROP POLICY IF EXISTS "Enhanced usuario management" ON public.usuarios;

-- 2. Criar função segura para verificar se usuário é master
CREATE OR REPLACE FUNCTION public.is_user_master_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'master'::app_role
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'dalpozzo.ti@gmail.com'
  );
$$;

-- 3. Atualizar função is_user_master para evitar recursão
CREATE OR REPLACE FUNCTION public.is_user_master()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_user_master_safe();
$$;

-- 4. Criar políticas simplificadas e seguras
-- Política básica: usuários veem próprios dados
CREATE POLICY "Users can view own data" 
ON public.usuarios 
FOR SELECT 
USING (id = auth.uid());

-- Política master: masters veem tudo usando função segura
CREATE POLICY "Masters can view all users" 
ON public.usuarios 
FOR SELECT 
USING (public.is_user_master_safe());

-- Política para compradores verem apenas dados básicos de outros compradores
CREATE POLICY "Compradores podem ver compradores" 
ON public.usuarios 
FOR SELECT 
USING (
  id = auth.uid() OR 
  public.is_user_master_safe() OR
  (EXISTS (
    SELECT 1 FROM public.user_roles ur1
    WHERE ur1.user_id = auth.uid() AND ur1.role = 'comprador'::app_role
  ) AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = usuarios.id AND ur2.role = 'comprador'::app_role
  ))
);

-- Política para edição: apenas próprios dados ou masters
CREATE POLICY "Users can edit own data or masters edit all" 
ON public.usuarios 
FOR ALL 
USING (
  id = auth.uid() OR 
  public.is_user_master_safe()
)
WITH CHECK (
  id = auth.uid() OR 
  public.is_user_master_safe()
);

-- Política para inserção via trigger
CREATE POLICY "Allow system to insert users" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (true);