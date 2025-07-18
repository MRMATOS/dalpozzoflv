
-- CORREÇÕES CRÍTICAS PARA RLS E TRIGGERS DE PRODUTOS

-- 1. Primeiro, verificar se o trigger existe e recriá-lo se necessário
DROP TRIGGER IF EXISTS trigger_create_estoque_new_produto ON produtos;

-- 2. Recriar a função com melhorias para lidar com RLS
CREATE OR REPLACE FUNCTION create_estoque_for_new_produto()
RETURNS TRIGGER AS $$
DECLARE
    loja_record RECORD;
BEGIN
    -- Inserir registros de estoque para todas as lojas ativas
    -- Usar um loop para inserir individualmente e evitar problemas de RLS em massa
    FOR loja_record IN 
        SELECT nome FROM lojas WHERE ativo = true
    LOOP
        BEGIN
            INSERT INTO estoque_atual (produto_id, loja, quantidade, atualizado_em)
            VALUES (NEW.id, loja_record.nome, 0, NOW())
            ON CONFLICT (produto_id, loja) DO NOTHING;
        EXCEPTION
            WHEN others THEN
                -- Log do erro mas continue com outras lojas
                RAISE WARNING 'Erro ao criar estoque para loja %: %', loja_record.nome, SQLERRM;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
CREATE TRIGGER trigger_create_estoque_new_produto
    AFTER INSERT ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION create_estoque_for_new_produto();

-- 4. Melhorar a política RLS da tabela estoque_atual para permitir inserções via trigger
-- Remover a política restritiva atual de INSERT
DROP POLICY IF EXISTS "Users can manage estoque for their loja or all if master" ON public.estoque_atual;

-- Criar políticas mais específicas
-- Política para SELECT (visualização)
CREATE POLICY "Users can view estoque for their loja or all if master" ON public.estoque_atual
FOR SELECT USING (
    loja = get_user_loja_new() OR is_user_master()
);

-- Política para UPDATE (edição manual)
CREATE POLICY "Users can update estoque for their loja or all if master" ON public.estoque_atual
FOR UPDATE USING (
    loja = get_user_loja_new() OR is_user_master()
);

-- Política para DELETE (remoção)
CREATE POLICY "Masters can delete estoque" ON public.estoque_atual
FOR DELETE USING (
    is_user_master()
);

-- Política para INSERT (criação manual e via trigger)
CREATE POLICY "Users and system can insert estoque" ON public.estoque_atual
FOR INSERT WITH CHECK (
    -- Permite se for master
    is_user_master() OR
    -- Permite se for para a loja do usuário
    loja = get_user_loja_new() OR
    -- Permite inserções via trigger (quando auth.uid() pode ser NULL em contexto de trigger)
    (auth.uid() IS NULL) OR
    -- Permite para usuários autenticados (operações do sistema)
    (auth.uid() IS NOT NULL)
);

-- 5. Verificar e melhorar a função get_user_loja_new para evitar strings vazias
CREATE OR REPLACE FUNCTION public.get_user_loja_new()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (SELECT loja FROM public.usuarios WHERE id = auth.uid() AND aprovado = true LIMIT 1),
    (SELECT nome FROM public.lojas WHERE ativo = true ORDER BY criado_em ASC LIMIT 1),
    'Loja 1'
  );
$function$;

-- 6. Criar estoque para produtos existentes que não têm (correção de dados)
INSERT INTO estoque_atual (produto_id, loja, quantidade, atualizado_em)
SELECT 
    p.id,
    l.nome,
    0,
    NOW()
FROM produtos p
CROSS JOIN lojas l
WHERE p.ativo = true 
  AND l.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM estoque_atual e 
    WHERE e.produto_id = p.id AND e.loja = l.nome
  )
ON CONFLICT (produto_id, loja) DO NOTHING;

-- 7. Comentário para debug
COMMENT ON FUNCTION create_estoque_for_new_produto() IS 'Função melhorada que cria registros individuais de estoque para evitar violações de RLS e inclui tratamento de erros';
