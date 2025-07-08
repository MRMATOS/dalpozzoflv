
-- SISTEMA DE PERMISSÕES PADRÃO POR TIPO DE USUÁRIO
-- Esta migração preserva todas as permissões existentes e adiciona apenas as que faltam

-- 1. FUNÇÃO PARA OBTER PERMISSÕES PADRÃO POR TIPO
CREATE OR REPLACE FUNCTION get_default_permissions_for_type(user_type TEXT)
RETURNS TABLE(resource system_resource, action permission_action) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    -- MASTER: Acesso total (gerenciado pela função is_user_master)
    
    -- CD: Gestão CD, Recebimento, Estoque (C/R/U/D completo)
    ('gestao_cd'::system_resource, 'view'::permission_action),
    ('gestao_cd'::system_resource, 'create'::permission_action),
    ('gestao_cd'::system_resource, 'edit'::permission_action),
    ('gestao_cd'::system_resource, 'delete'::permission_action),
    ('estoque'::system_resource, 'view'::permission_action),
    ('estoque'::system_resource, 'create'::permission_action),
    ('estoque'::system_resource, 'edit'::permission_action),
    ('estoque'::system_resource, 'delete'::permission_action),
    ('dashboard'::system_resource, 'view'::permission_action)
  ) AS cd_permissions(resource, action)
  WHERE user_type = 'cd'
  
  UNION ALL
  
  SELECT * FROM (VALUES
    -- COMPRADOR: Cotação, Requisições, Estoque, Históricos (C/R/U/D completo)
    ('cotacao'::system_resource, 'view'::permission_action),
    ('cotacao'::system_resource, 'create'::permission_action),
    ('cotacao'::system_resource, 'edit'::permission_action),
    ('cotacao'::system_resource, 'delete'::permission_action),
    ('requisicoes'::system_resource, 'view'::permission_action),
    ('requisicoes'::system_resource, 'create'::permission_action),
    ('requisicoes'::system_resource, 'edit'::permission_action),
    ('requisicoes'::system_resource, 'delete'::permission_action),
    ('estoque'::system_resource, 'view'::permission_action),
    ('estoque'::system_resource, 'create'::permission_action),
    ('estoque'::system_resource, 'edit'::permission_action),
    ('estoque'::system_resource, 'delete'::permission_action),
    ('historico_pedidos'::system_resource, 'view'::permission_action),
    ('historico_requisicoes'::system_resource, 'view'::permission_action),
    ('dashboard'::system_resource, 'view'::permission_action)
  ) AS comprador_permissions(resource, action)
  WHERE user_type = 'comprador'
  
  UNION ALL
  
  SELECT * FROM (VALUES
    -- ESTOQUE: Requisições e Estoque (C/R/U/D completo)
    ('requisicoes'::system_resource, 'view'::permission_action),
    ('requisicoes'::system_resource, 'create'::permission_action),
    ('requisicoes'::system_resource, 'edit'::permission_action),
    ('requisicoes'::system_resource, 'delete'::permission_action),
    ('estoque'::system_resource, 'view'::permission_action),
    ('estoque'::system_resource, 'create'::permission_action),
    ('estoque'::system_resource, 'edit'::permission_action),
    ('estoque'::system_resource, 'delete'::permission_action),
    ('dashboard'::system_resource, 'view'::permission_action)
  ) AS estoque_permissions(resource, action)
  WHERE user_type = 'estoque';
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. FUNÇÃO PARA POPULAR PERMISSÕES PADRÃO (PRESERVANDO EXISTENTES)
CREATE OR REPLACE FUNCTION populate_default_permissions(target_user_id UUID, user_type TEXT)
RETURNS VOID AS $$
DECLARE
  perm_record RECORD;
BEGIN
  -- Inserir apenas permissões que não existem ainda (PRESERVA TODAS AS EXISTENTES)
  FOR perm_record IN 
    SELECT resource, action 
    FROM get_default_permissions_for_type(user_type)
  LOOP
    INSERT INTO public.user_permissions (user_id, resource, action, enabled)
    VALUES (target_user_id, perm_record.resource, perm_record.action, true)
    ON CONFLICT (user_id, resource, action) DO NOTHING; -- CHAVE: não sobrescreve existentes
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. POPULAR PERMISSÕES PARA USUÁRIOS EXISTENTES (PRESERVANDO O QUE JÁ EXISTE)
-- Isso vai adicionar apenas as permissões que faltam, mantendo customizações existentes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, tipo FROM usuarios WHERE aprovado = true AND tipo != 'master'
  LOOP
    PERFORM populate_default_permissions(user_record.id, user_record.tipo);
  END LOOP;
END $$;

-- 4. TRIGGER PARA NOVOS USUÁRIOS APROVADOS
CREATE OR REPLACE FUNCTION auto_create_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um usuário é aprovado ou criado já aprovado
  IF (TG_OP = 'INSERT' AND NEW.aprovado = true) OR 
     (TG_OP = 'UPDATE' AND OLD.aprovado = false AND NEW.aprovado = true) THEN
    
    -- Não criar permissões para masters (eles têm acesso total via função)
    IF NEW.tipo != 'master' THEN
      PERFORM populate_default_permissions(NEW.id, NEW.tipo);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger se não existir
DROP TRIGGER IF EXISTS trigger_auto_create_permissions ON usuarios;
CREATE TRIGGER trigger_auto_create_permissions
  AFTER INSERT OR UPDATE OF aprovado ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_permissions();

-- 5. VERIFICAÇÃO DE INTEGRIDADE (apenas para debug, pode ser removido depois)
-- Esta query mostra quantas permissões cada usuário tem agora
SELECT 
  u.nome,
  u.tipo,
  COUNT(up.id) as total_permissions,
  string_agg(DISTINCT up.resource::text, ', ') as resources
FROM usuarios u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.aprovado = true
GROUP BY u.id, u.nome, u.tipo
ORDER BY u.nome;
