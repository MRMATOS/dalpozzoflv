
-- 1. Limpar políticas conflitantes existentes
DROP POLICY IF EXISTS "Users can view their own data" ON public.usuarios;
DROP POLICY IF EXISTS "Allow login by access code" ON public.usuarios;
DROP POLICY IF EXISTS "Allow master to select records" ON public.usuarios;
DROP POLICY IF EXISTS "Allow master to update records" ON public.usuarios;
DROP POLICY IF EXISTS "Allow master to delete records" ON public.usuarios;
DROP POLICY IF EXISTS "Allow master to insert records" ON public.usuarios;

-- 2. Criar função para verificar se usuário é master
CREATE OR REPLACE FUNCTION public.is_user_master()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND loja = 'Master'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master'
  ) OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo = 'master'
  );
$$;

-- 3. Criar função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    (SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    'estoque'
  );
$$;

-- 4. Criar função para obter loja do usuário (novo sistema)
CREATE OR REPLACE FUNCTION public.get_user_loja_new()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT loja FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    (SELECT loja FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    ''
  );
$$;

-- 5. Criar função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    user_data jsonb;
    is_master_email boolean := false;
BEGIN
    user_data := new.raw_user_meta_data;
    
    -- Verificar se é o email master
    IF new.email = 'dalpozzo.ti@gmail.com' THEN
        is_master_email := true;
    END IF;
    
    -- Inserir no profiles
    INSERT INTO public.profiles (
        id, 
        nome, 
        loja, 
        codigo_acesso,
        ativo
    ) VALUES (
        new.id,
        COALESCE(user_data->>'name', user_data->>'nome', SPLIT_PART(new.email, '@', 1)),
        CASE WHEN is_master_email THEN 'Master' ELSE COALESCE(user_data->>'loja', 'Loja 1') END,
        CASE WHEN is_master_email THEN 'MASTER2024' ELSE '' END,
        true
    );
    
    -- Inserir role apropriada
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
$$;

-- 6. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 7. Aplicar novas políticas RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Masters can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_user_master());

CREATE POLICY "Masters can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_user_master());

CREATE POLICY "Masters can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.is_user_master());

CREATE POLICY "Masters can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_user_master());

-- 8. Aplicar políticas RLS corretas para usuarios (manter compatibilidade)
CREATE POLICY "Users can view own usuario data" ON public.usuarios
    FOR SELECT USING (auth.uid() = id OR public.is_user_master());

CREATE POLICY "Masters can manage usuarios" ON public.usuarios
    FOR ALL USING (public.is_user_master());

-- 9. Atualizar políticas de estoque_atual
DROP POLICY IF EXISTS "Users can upsert estoque for their loja" ON public.estoque_atual;

CREATE POLICY "Users can view estoque for their loja" ON public.estoque_atual
    FOR SELECT USING (
        loja = public.get_user_loja_new() OR 
        public.is_user_master()
    );

CREATE POLICY "Users can manage estoque for their loja" ON public.estoque_atual
    FOR ALL USING (
        loja = public.get_user_loja_new() OR 
        public.is_user_master()
    );
