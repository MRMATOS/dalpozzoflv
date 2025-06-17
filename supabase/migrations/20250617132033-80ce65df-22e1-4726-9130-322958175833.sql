
-- 1. Corrigir dados inconsistentes na tabela produtos
-- Limpar produtos que têm produto_pai_id apontando para si mesmos
UPDATE produtos 
SET produto_pai_id = NULL 
WHERE produto_pai_id = id;

-- 2. Padronizar estrutura de variações
-- Para produtos que são variações, garantir que produto seja NULL e nome_variacao seja preenchido
UPDATE produtos 
SET produto = NULL 
WHERE produto_pai_id IS NOT NULL AND nome_variacao IS NOT NULL;

-- 3. Adicionar foreign key constraint com CASCADE na tabela estoque_atual
-- Primeiro, vamos verificar se existe a constraint e removê-la se necessário
ALTER TABLE estoque_atual DROP CONSTRAINT IF EXISTS estoque_atual_produto_id_fkey;

-- Adicionar a constraint com CASCADE DELETE
ALTER TABLE estoque_atual 
ADD CONSTRAINT estoque_atual_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

-- 4. Criar função para criar registros de estoque automaticamente
CREATE OR REPLACE FUNCTION create_estoque_for_new_produto()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir registros de estoque para todas as lojas ativas
    INSERT INTO estoque_atual (produto_id, loja, quantidade, atualizado_em)
    SELECT 
        NEW.id,
        l.nome,
        0,
        NOW()
    FROM lojas l
    WHERE l.ativo = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para automatizar criação de estoque
DROP TRIGGER IF EXISTS trigger_create_estoque_new_produto ON produtos;
CREATE TRIGGER trigger_create_estoque_new_produto
    AFTER INSERT ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION create_estoque_for_new_produto();

-- 6. Criar registros de estoque para produtos existentes que não têm
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
  );

-- 7. Criar função para verificar dependências antes de deletar produto
CREATE OR REPLACE FUNCTION check_produto_dependencies(produto_uuid UUID)
RETURNS TABLE(
    has_estoque BOOLEAN,
    has_requisicoes BOOLEAN,
    has_cotacoes BOOLEAN,
    estoque_total NUMERIC,
    message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM estoque_atual WHERE produto_id = produto_uuid AND quantidade > 0) as has_estoque,
        EXISTS(SELECT 1 FROM itens_requisicao WHERE produto_id = produto_uuid) as has_requisicoes,
        EXISTS(SELECT 1 FROM itens_cotacao WHERE produto_id = produto_uuid) as has_cotacoes,
        COALESCE((SELECT SUM(quantidade) FROM estoque_atual WHERE produto_id = produto_uuid), 0) as estoque_total,
        CASE 
            WHEN EXISTS(SELECT 1 FROM estoque_atual WHERE produto_id = produto_uuid AND quantidade > 0) THEN
                'Produto possui estoque em uma ou mais lojas'
            WHEN EXISTS(SELECT 1 FROM itens_requisicao WHERE produto_id = produto_uuid) THEN
                'Produto possui histórico de requisições'
            WHEN EXISTS(SELECT 1 FROM itens_cotacao WHERE produto_id = produto_uuid) THEN
                'Produto possui histórico de cotações'
            ELSE 'Produto pode ser excluído com segurança'
        END as message;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar função para limpar estoque de um produto antes de excluir
CREATE OR REPLACE FUNCTION clear_produto_estoque(produto_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM estoque_atual WHERE produto_id = produto_uuid;
    RETURN true;
END;
$$ LANGUAGE plpgsql;
