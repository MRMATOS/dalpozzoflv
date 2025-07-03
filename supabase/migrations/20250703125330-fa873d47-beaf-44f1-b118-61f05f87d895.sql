-- CORREÇÃO DO TRIGGER DE CRIAÇÃO DE PERFIL E CRIAÇÃO DO PERFIL MASTER

-- 1. Remover trigger existente e recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. Criar perfil manual para o usuário master existente
INSERT INTO public.profiles (
    id, 
    nome, 
    loja, 
    codigo_acesso,
    ativo
) VALUES (
    'a5e2a940-2ca5-4190-9ac8-87ea8f8093e7'::uuid,
    'TI Dalpozzo',
    'Master',
    'MASTER2024',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. Criar role master para o usuário
INSERT INTO public.user_roles (user_id, role)
VALUES (
    'a5e2a940-2ca5-4190-9ac8-87ea8f8093e7'::uuid, 
    'master'::app_role
) ON CONFLICT (user_id, role) DO NOTHING;