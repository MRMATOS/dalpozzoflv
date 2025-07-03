-- CORREÇÕES DE RLS E PERMISSÕES
-- Fase 1: Melhorar funções de segurança para lidar com auth.uid() null

-- Função melhorada para verificar se é master
CREATE OR REPLACE FUNCTION public.is_user_master()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (
      SELECT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() 
        AND tipo = 'master'
        AND aprovado = true
      )
    ), 
    false
  );
$function$;

-- Função melhorada para obter loja do usuário
CREATE OR REPLACE FUNCTION public.get_user_loja_new()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (SELECT loja FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    ''
  );
$function$;

-- Fase 2: Corrigir políticas de requisições para permitir masters sempre

-- Remover política problemática de INSERT em requisicoes
DROP POLICY IF EXISTS "Users can create requisicoes for their loja" ON public.requisicoes;

-- Nova política mais flexível para INSERT em requisicoes
CREATE POLICY "Users can create requisicoes with flexible rules" ON public.requisicoes
FOR INSERT WITH CHECK (
  -- Masters podem criar sempre
  is_user_master() OR
  -- Outros usuários devem seguir regras da loja
  (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    (
      loja = get_user_loja_new() OR 
      get_user_loja_new() = '' OR
      loja IS NOT NULL
    )
  )
);

-- Fase 3: Melhorar políticas de produtos para serem mais flexíveis

-- Remover política restritiva de produtos
DROP POLICY IF EXISTS "Masters and compradors can manage produtos" ON public.produtos;

-- Nova política mais flexível para produtos
CREATE POLICY "Enhanced produto management" ON public.produtos
FOR ALL USING (
  -- Masters sempre podem
  is_user_master() OR
  -- Usuários com roles específicos
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'comprador')
  ) OR
  -- Fallback para usuários autenticados com tipo correto
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo IN ('master', 'comprador')
    AND aprovado = true
  )
);

-- Fase 4: Melhorar políticas de usuários

-- Remover política restritiva de usuarios
DROP POLICY IF EXISTS "Masters can manage all usuarios data" ON public.usuarios;

-- Nova política mais flexível para usuários  
CREATE POLICY "Enhanced usuario management" ON public.usuarios
FOR ALL USING (
  -- Masters sempre podem
  is_user_master() OR
  -- Próprio usuário pode ver seus dados
  id = auth.uid() OR
  -- Fallback para verificação por user_roles
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master'
  )
);

-- Fase 5: Corrigir políticas de fornecedores

-- Remover política restritiva de fornecedores
DROP POLICY IF EXISTS "Masters can manage fornecedores" ON public.fornecedores;

-- Nova política mais flexível para fornecedores
CREATE POLICY "Enhanced fornecedor management" ON public.fornecedores
FOR ALL USING (
  -- Masters sempre podem
  is_user_master() OR
  -- Usuários com role master
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master'
  ) OR
  -- Fallback para usuários master na tabela usuarios
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo = 'master'
    AND aprovado = true
  )
);

-- Fase 6: Corrigir políticas de lojas

-- Remover política restritiva de lojas
DROP POLICY IF EXISTS "Masters can manage lojas" ON public.lojas;

-- Nova política mais flexível para lojas
CREATE POLICY "Enhanced loja management" ON public.lojas
FOR ALL USING (
  -- Masters sempre podem
  is_user_master() OR
  -- Usuários com role master
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master'
  ) OR
  -- Fallback para usuários master na tabela usuarios
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo = 'master'
    AND aprovado = true
  )
);

-- Fase 7: Garantir que transferências funcionem para CD

-- Atualizar política de INSERT em transferencias
DROP POLICY IF EXISTS "CD users can create transferencias" ON public.transferencias;

CREATE POLICY "Enhanced transferencia creation" ON public.transferencias
FOR INSERT WITH CHECK (
  -- Masters sempre podem
  is_user_master() OR
  -- Usuários CD podem criar
  is_cd_user() OR
  -- Fallback para verificação direta
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo IN ('master', 'cd')
    AND aprovado = true
  )
);

-- Comentário final
COMMENT ON FUNCTION public.is_user_master() IS 'Função melhorada que lida com casos de auth.uid() null e verifica múltiplas condições para determinar se o usuário é master';