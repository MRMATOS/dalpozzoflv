-- 1. Migrar dados do profiles para usuarios (se não existirem)
INSERT INTO public.usuarios (id, nome, loja, codigo_acesso, ativo, tipo, ultimo_login, criado_em)
SELECT 
  p.id,
  p.nome,
  p.loja,
  p.codigo_acesso,
  p.ativo,
  COALESCE(ur.role::text, 'estoque') as tipo,
  p.ultimo_login,
  p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios u WHERE u.id = p.id
);

-- 2. Corrigir trigger para criar usuários na tabela usuarios (não profiles)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    user_data jsonb;
    is_master_email boolean := false;
    default_loja text;
BEGIN
    user_data := new.raw_user_meta_data;
    
    -- Verificar se é o email master
    IF new.email = 'dalpozzo.ti@gmail.com' THEN
        is_master_email := true;
    END IF;
    
    -- Buscar primeira loja ativa (que não seja CD) como padrão
    SELECT nome INTO default_loja 
    FROM public.lojas 
    WHERE ativo = true AND (is_cd = false OR is_cd IS NULL)
    ORDER BY criado_em ASC
    LIMIT 1;
    
    -- Fallback para 'Loja 1' se não encontrar nenhuma loja
    IF default_loja IS NULL THEN
        default_loja := 'Loja 1';
    END IF;
    
    -- Inserir no usuarios (tabela principal)
    INSERT INTO public.usuarios (
        id, 
        nome, 
        loja, 
        codigo_acesso,
        ativo,
        tipo
    ) VALUES (
        new.id,
        COALESCE(user_data->>'name', user_data->>'nome', SPLIT_PART(new.email, '@', 1)),
        CASE WHEN is_master_email THEN 'Master' ELSE default_loja END,
        CASE WHEN is_master_email THEN 'MASTER2024' ELSE '' END,
        true,
        CASE WHEN is_master_email THEN 'master' ELSE 'estoque' END
    );
    
    -- Inserir role na tabela user_roles para compatibilidade
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        new.id, 
        CASE WHEN is_master_email THEN 'master'::app_role ELSE 'estoque'::app_role END
    );
    
    RETURN new;
EXCEPTION
    WHEN others THEN
        -- Log do erro mas não bloqueia a criação do usuário
        RAISE WARNING 'Erro ao criar perfil do usuário: %', SQLERRM;
        RETURN new;
END;
$function$;

-- 3. Atualizar função para buscar loja do usuário
CREATE OR REPLACE FUNCTION public.get_user_loja_new()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (SELECT loja FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    (SELECT loja FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    ''
  );
$function$;

-- 4. Atualizar função para verificar se é master
CREATE OR REPLACE FUNCTION public.is_user_master()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo = 'master'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND loja = 'Master'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master'
  );
$function$;

-- 5. Criar função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'estoque'
  );
$function$;