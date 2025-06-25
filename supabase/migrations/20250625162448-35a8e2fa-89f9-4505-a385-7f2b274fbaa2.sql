
-- Criar enum para recursos do sistema
CREATE TYPE public.system_resource AS ENUM (
  'dashboard',
  'estoque', 
  'requisicoes',
  'cotacao',
  'gestao_cd',
  'configuracoes',
  'historico_requisicoes',
  'historico_pedidos'
);

-- Criar enum para ações
CREATE TYPE public.permission_action AS ENUM (
  'view',
  'edit', 
  'create',
  'delete'
);

-- Criar tabela de permissões de usuário
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  resource system_resource NOT NULL,
  action permission_action NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource, action)
);

-- Criar índices para performance
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_resource ON public.user_permissions(resource);

-- Função para verificar permissões específicas
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id UUID,
  _resource system_resource,
  _action permission_action
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = _user_id 
    AND resource = _resource 
    AND action = _action 
    AND enabled = true
  ) OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = _user_id AND tipo = 'master'
  );
$$;

-- Função para obter todas as permissões de um usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE(resource system_resource, action permission_action, enabled BOOLEAN)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    up.resource,
    up.action,
    up.enabled
  FROM public.user_permissions up
  WHERE up.user_id = _user_id;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_user_permissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_permissions_updated_at();

-- Inserir permissões padrão para usuários do tipo 'estoque'
INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'dashboard'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'estoque'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'estoque'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'estoque'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'estoque'::system_resource,
  'edit'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'estoque'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'requisicoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'estoque'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'requisicoes'::system_resource,
  'create'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'estoque'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'gestao_cd'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'estoque'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'historico_requisicoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'estoque'
ON CONFLICT (user_id, resource, action) DO NOTHING;

-- Permissões para tipo 'comprador'
INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'dashboard'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'cotacao'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'cotacao'::system_resource,
  'create'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'cotacao'::system_resource,
  'edit'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'configuracoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'configuracoes'::system_resource,
  'edit'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'historico_pedidos'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'historico_requisicoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'comprador'
ON CONFLICT (user_id, resource, action) DO NOTHING;

-- Permissões para tipo 'cd'
INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'dashboard'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'estoque'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'estoque'::system_resource,
  'edit'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'gestao_cd'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'gestao_cd'::system_resource,
  'edit'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'configuracoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'configuracoes'::system_resource,
  'edit'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'historico_requisicoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'cd'
ON CONFLICT (user_id, resource, action) DO NOTHING;

-- Permissões para tipo 'requisitante'
INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'dashboard'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'requisitante'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'requisicoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'requisitante'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'requisicoes'::system_resource,
  'create'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'requisitante'
ON CONFLICT (user_id, resource, action) DO NOTHING;

INSERT INTO public.user_permissions (user_id, resource, action, enabled)
SELECT 
  u.id,
  'historico_requisicoes'::system_resource,
  'view'::permission_action,
  true
FROM public.usuarios u
WHERE u.tipo = 'requisitante'
ON CONFLICT (user_id, resource, action) DO NOTHING;
