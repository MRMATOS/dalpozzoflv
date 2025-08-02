-- ETAPA 1: Correção crítica do banco de dados
-- Corrigir nome_base NULL em variações de produtos

-- Atualizar nome_base das variações com o nome do produto pai
UPDATE public.produtos 
SET nome_base = pai.produto
FROM public.produtos pai
WHERE produtos.produto_pai_id = pai.id 
  AND produtos.nome_base IS NULL;

-- Atualizar nome_base dos produtos pais que não têm (caso existam)
UPDATE public.produtos 
SET nome_base = produto
WHERE produto_pai_id IS NULL 
  AND nome_base IS NULL
  AND produto IS NOT NULL;

-- Verificar resultado da correção
-- Esta query deve retornar 0 após a correção
SELECT COUNT(*) as produtos_sem_nome_base
FROM public.produtos 
WHERE nome_base IS NULL AND ativo = true;