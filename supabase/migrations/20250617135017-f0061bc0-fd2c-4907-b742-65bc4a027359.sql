
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

-- 3. Corrigir o caso específico do "Cabotiá" que deveria ser variação da Abóbora
-- Primeiro, encontrar o ID da Abóbora
WITH abobora_id AS (
  SELECT id FROM produtos WHERE produto = 'Abóbora' AND produto_pai_id IS NULL LIMIT 1
)
UPDATE produtos 
SET 
  produto = NULL,
  nome_variacao = 'Cabotiá',
  produto_pai_id = (SELECT id FROM abobora_id)
WHERE produto = 'Cabotiá' AND produto_pai_id IS NULL;

-- 4. Verificar e corrigir outros casos similares de produtos que deveriam ser variações
-- Identificar produtos duplicados que podem ser variações
UPDATE produtos 
SET 
  produto = NULL,
  nome_variacao = CASE 
    WHEN produto LIKE '%Japonesa%' THEN 'Japonesa'
    WHEN produto LIKE '%Italiana%' THEN 'Italiana'
    WHEN produto LIKE '%Paulista%' THEN 'Paulista'
    WHEN produto LIKE '%Salada%' THEN 'Salada'
    WHEN produto LIKE '%Lisa%' THEN 'Lisa'
    WHEN produto LIKE '%Crespa%' THEN 'Crespa'
    ELSE produto
  END,
  produto_pai_id = (
    SELECT p2.id 
    FROM produtos p2 
    WHERE p2.produto_pai_id IS NULL 
    AND (
      (produtos.produto LIKE CONCAT(p2.produto, '%') AND p2.produto != produtos.produto) OR
      (produtos.produto LIKE CONCAT('% ', p2.produto, '%'))
    )
    LIMIT 1
  )
WHERE produto_pai_id IS NULL 
AND EXISTS (
  SELECT 1 
  FROM produtos p2 
  WHERE p2.produto_pai_id IS NULL 
  AND (
    (produtos.produto LIKE CONCAT(p2.produto, '%') AND p2.produto != produtos.produto) OR
    (produtos.produto LIKE CONCAT('% ', p2.produto, '%'))
  )
);

-- 5. Garantir que produtos pai não tenham nome_variacao
UPDATE produtos 
SET nome_variacao = NULL 
WHERE produto_pai_id IS NULL AND nome_variacao IS NOT NULL;

-- 6. Remover registros de estoque órfãos (se houver)
DELETE FROM estoque_atual 
WHERE produto_id NOT IN (SELECT id FROM produtos);

-- 7. Criar registros de estoque para produtos que não têm
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
