
-- Verificar a estrutura atual da tabela requisicoes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'requisicoes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar as foreign keys existentes na tabela requisicoes
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='requisicoes'
AND tc.table_schema = 'public';

-- Remover foreign keys incorretas que referenciam auth.users (se existirem)
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Buscar constraints que referenciam auth.users
    FOR constraint_name IN 
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
        EXECUTE 'ALTER TABLE public.requisicoes DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- Adicionar foreign key correta para usuario_id referenciando public.usuarios
ALTER TABLE public.requisicoes 
ADD CONSTRAINT fk_requisicoes_usuario_id 
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);

-- Verificar se user_id ainda é necessário ou se pode ser removido
-- (vamos manter por compatibilidade, mas sem foreign key para auth.users)

-- Verificar a estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'requisicoes' AND table_schema = 'public'
ORDER BY ordinal_position;
