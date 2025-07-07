-- Correção do trigger de criação de usuário e processamento do usuário perdido

-- 1. Corrigir a função handle_new_auth_user para usar o search_path correto
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        CASE WHEN is_master_email THEN 'master'::public.app_role ELSE 'estoque'::public.app_role END
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
$$;

-- 2. Processar manualmente o usuário que ficou perdido (se ainda existir)
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
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)),
    'Home',
    '',
    true,
    'estoque',
    false
FROM auth.users u
WHERE u.email = 'incrivelprojeto@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.usuarios WHERE id = u.id
);

-- 3. Inserir role para o usuário perdido se necessário
INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id, 
    'estoque'::public.app_role
FROM auth.users u
WHERE u.email = 'incrivelprojeto@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = u.id
);