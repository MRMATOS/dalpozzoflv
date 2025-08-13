-- 1) Corrigir produtos de variação que têm produto vazio mas têm pai
UPDATE public.produtos 
SET produto = CONCAT(
  (SELECT produto FROM public.produtos pai WHERE pai.id = produtos.produto_pai_id), 
  ' ', 
  produtos.nome_variacao
)
WHERE produto_pai_id IS NOT NULL 
  AND (produto IS NULL OR produto = '' OR trim(produto) = '')
  AND nome_variacao IS NOT NULL 
  AND nome_variacao != '';

-- 2) Verificar quantos produtos foram corrigidos
-- (Esta query é só para informação, será executada depois)

-- 3) Regenerar sinônimos para os produtos corrigidos
DELETE FROM public.sinonimos_produto 
WHERE produto_id IN (
  SELECT id FROM public.produtos 
  WHERE produto_pai_id IS NOT NULL 
    AND nome_variacao IS NOT NULL 
    AND nome_variacao != ''
);

-- 4) Triggerar regeneração automática dos sinônimos
-- (O trigger auto_generate_sinonimos_produto será executado automaticamente)