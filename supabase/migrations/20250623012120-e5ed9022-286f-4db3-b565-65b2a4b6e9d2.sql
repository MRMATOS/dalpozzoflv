
-- Verificar todas as constraints existentes na tabela requisicoes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'requisicoes'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Remover TODAS as foreign keys que referenciam auth.users
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar e remover todas as constraints que referenciam auth.users
    FOR constraint_record IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'requisicoes'
        AND tc.table_schema = 'public'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
    LOOP
        EXECUTE 'ALTER TABLE public.requisicoes DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Removida constraint: %', constraint_record.constraint_name;
    END LOOP;
    
    -- Remover especificamente a constraint problemática se ainda existir
    EXECUTE 'ALTER TABLE public.requisicoes DROP CONSTRAINT IF EXISTS requisicoes_user_id_fkey';
    RAISE NOTICE 'Tentativa de remoção da constraint requisicoes_user_id_fkey';
END $$;

-- Verificar se a foreign key correta para usuario_id já existe, se não, criar
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_requisicoes_usuario_id' 
        AND table_name = 'requisicoes'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar foreign key correta para usuario_id referenciando public.usuarios
        ALTER TABLE public.requisicoes 
        ADD CONSTRAINT fk_requisicoes_usuario_id 
        FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
        RAISE NOTICE 'Adicionada constraint fk_requisicoes_usuario_id';
    END IF;
END $$;

-- Verificar a estrutura final das constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'requisicoes'
AND tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;
