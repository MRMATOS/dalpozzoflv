-- 1. Adicionar campo aprovado na tabela usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS aprovado boolean DEFAULT false;

-- 2. Atualizar usuários existentes como aprovados
UPDATE public.usuarios SET aprovado = true WHERE aprovado IS NULL OR aprovado = false;

-- 3. Deletar trigger existente se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- 4. Recriar função do trigger com melhor tratamento
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
        tipo,
        aprovado
    ) VALUES (
        new.id,
        COALESCE(user_data->>'name', user_data->>'nome', SPLIT_PART(new.email, '@', 1)),
        CASE WHEN is_master_email THEN 'Master' ELSE default_loja END,
        CASE WHEN is_master_email THEN 'MASTER2024' ELSE '' END,
        true,
        CASE WHEN is_master_email THEN 'master' ELSE 'estoque' END,
        CASE WHEN is_master_email THEN true ELSE false END
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

-- 5. Recriar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. Adicionar política RLS para permitir inserção automática
CREATE POLICY "Allow trigger to insert new users" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (true);

-- 7. Adicionar política para permitir inserção de roles
CREATE POLICY "Allow trigger to insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

-- 8. Atualizar função is_user_master para considerar aprovação
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

-- 9. Criar função para aprovar usuários
CREATE OR REPLACE FUNCTION public.aprovar_usuario(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Só masters podem aprovar usuários
  IF NOT is_user_master() THEN
    RETURN false;
  END IF;
  
  UPDATE public.usuarios 
  SET aprovado = true 
  WHERE id = user_uuid;
  
  RETURN FOUND;
END;
$function$;