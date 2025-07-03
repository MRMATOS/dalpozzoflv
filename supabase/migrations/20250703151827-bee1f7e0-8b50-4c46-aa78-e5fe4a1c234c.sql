-- 1. Verificar e dropar trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- 2. Recriar função do trigger corrigida
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
    
    -- Inserir no usuarios APENAS se não existir ainda
    INSERT INTO public.usuarios (
        id, 
        nome, 
        loja, 
        codigo_acesso,
        ativo,
        tipo,
        aprovado
    ) 
    SELECT 
        new.id,
        COALESCE(user_data->>'name', user_data->>'nome', SPLIT_PART(new.email, '@', 1)),
        CASE WHEN is_master_email THEN 'Master' ELSE default_loja END,
        CASE WHEN is_master_email THEN 'MASTER2024' ELSE '' END,
        true,
        CASE WHEN is_master_email THEN 'master' ELSE 'estoque' END,
        CASE WHEN is_master_email THEN true ELSE false END
    WHERE NOT EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = new.id
    );
    
    -- Inserir role na tabela user_roles para compatibilidade APENAS se não existir
    INSERT INTO public.user_roles (user_id, role)
    SELECT 
        new.id, 
        CASE WHEN is_master_email THEN 'master'::app_role ELSE 'estoque'::app_role END
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = new.id
    );
    
    RETURN new;
EXCEPTION
    WHEN others THEN
        -- Log do erro mas não bloqueia a criação do usuário
        RAISE WARNING 'Erro ao criar perfil do usuário: %', SQLERRM;
        RETURN new;
END;
$function$;

-- 3. Recriar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Migrar usuário perdido manualmente (mrmimico@gmail.com)
-- Primeiro verificar se existe no auth.users e criar perfil se necessário
DO $$
DECLARE
    user_record record;
    default_loja text;
BEGIN
    -- Buscar primeira loja ativa não-CD
    SELECT nome INTO default_loja 
    FROM public.lojas 
    WHERE ativo = true AND (is_cd = false OR is_cd IS NULL)
    ORDER BY criado_em ASC
    LIMIT 1;
    
    -- Fallback
    IF default_loja IS NULL THEN
        default_loja := 'Loja 1';
    END IF;
    
    -- Procurar usuários em auth.users que não têm perfil em usuarios
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.usuarios u ON u.id = au.id
        WHERE u.id IS NULL
    LOOP
        -- Criar perfil para usuário sem perfil
        INSERT INTO public.usuarios (
            id, 
            nome, 
            loja, 
            codigo_acesso,
            ativo,
            tipo,
            aprovado
        ) VALUES (
            user_record.id,
            COALESCE(
                user_record.raw_user_meta_data->>'name', 
                user_record.raw_user_meta_data->>'nome', 
                SPLIT_PART(user_record.email, '@', 1)
            ),
            CASE 
                WHEN user_record.email = 'dalpozzo.ti@gmail.com' THEN 'Master' 
                ELSE default_loja 
            END,
            CASE 
                WHEN user_record.email = 'dalpozzo.ti@gmail.com' THEN 'MASTER2024' 
                ELSE '' 
            END,
            true,
            CASE 
                WHEN user_record.email = 'dalpozzo.ti@gmail.com' THEN 'master' 
                ELSE 'estoque' 
            END,
            CASE 
                WHEN user_record.email = 'dalpozzo.ti@gmail.com' THEN true 
                ELSE false 
            END
        );
        
        -- Criar role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (
            user_record.id, 
            CASE 
                WHEN user_record.email = 'dalpozzo.ti@gmail.com' THEN 'master'::app_role 
                ELSE 'estoque'::app_role 
            END
        )
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Criado perfil para usuário: %', user_record.email;
    END LOOP;
END $$;

-- 5. Atualizar função is_user_master para usar apenas tabela usuarios
CREATE OR REPLACE FUNCTION public.is_user_master()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo = 'master'
    AND aprovado = true
  );
$function$;

-- 6. Atualizar get_user_loja_new para usar apenas usuarios
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

-- 7. Atualizar get_user_role para usar apenas usuarios
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