-- Migração do Dicionário Atualizado para Sinônimos
-- Primeiro criar constraint única se não existir
ALTER TABLE public.sinonimos_produto 
ADD CONSTRAINT IF NOT EXISTS sinonimos_produto_unique 
UNIQUE (produto_id, sinonimo);

-- Limpar tabela de sinônimos existente
DELETE FROM public.sinonimos_produto;

-- Migrar sinônimos do dicionário atualizado
WITH dicionario_data AS (
  SELECT unnest(ARRAY[
    -- ABACATE
    'abacate', 'abacate bola', 'abacatekg bola', 'abacate breda', 'abacatekg breda',
    -- ABACAXI
    'abacaxi', 'abacaxi havaí', 'abacaxi hawaii', 'abacaxi cabotiá', 'abacaxi cabotia',
    -- ACELGA
    'acelga', 'acelga comum', 'acelga maço', 'acelga maco', 'acelga kg',
    -- AIPO
    'aipo', 'aipo comum', 'aipo maço', 'aipo maco', 'aipo kg',
    -- ALFACE
    'alface', 'alface americana', 'alface crespa', 'alface lisa', 'alface mimosa',
    'alface roxa', 'alface romana', 'alface hidroponica', 'alface hidropônica',
    -- BANANA
    'banana', 'banana caturra', 'banana prata', 'banana nanica', 'banana da terra',
    'banana maçã', 'banana maca', 'banana ouro', 'banana são tomé', 'banana sao tome',
    -- BETERRABA
    'beterraba', 'beterraba comum', 'beterraba produtor', 'beterraba kg',
    -- BRÓCOLIS
    'brócolis', 'brocolis', 'brócolis comum', 'brocolis comum', 'brócolis kg', 'brocolis kg',
    -- CEBOLA
    'cebola', 'cebola comum', 'cebola branca', 'cebola roxa', 'cebola kg',
    -- CENOURA
    'cenoura', 'cenoura comum', 'cenoura baby', 'cenoura kg',
    -- COUVE
    'couve', 'couve manteiga', 'couve comum', 'couve flor', 'couve-flor', 'couve kg',
    -- LIMÃO
    'limão', 'limao', 'limão taiti', 'limao taiti', 'limão galego', 'limao galego',
    'limão siciliano', 'limao siciliano', 'limão kg', 'limao kg',
    -- MAMÃO
    'mamão', 'mamao', 'mamão formosa', 'mamao formosa', 'mamão papaya', 'mamao papaya',
    'mamão roça', 'mamao roca', 'mamão kg', 'mamao kg',
    -- MARACUJÁ
    'maracujá', 'maracuja', 'maracujá graúdo', 'maracuja graudo', 'maracujá plástica', 'maracuja plastica',
    'maracujá papelão', 'maracuja papelao', 'maracujá ceasa', 'maracuja ceasa', 'maracujá kg', 'maracuja kg',
    -- MELANCIA
    'melancia', 'melancia comum', 'melancia kg',
    -- MELÃO
    'melão', 'melao', 'melão amarelo', 'melao amarelo', 'melão kg', 'melao kg',
    -- PIMENTÃO
    'pimentão', 'pimentao', 'pimentão verde', 'pimentao verde', 'pimentão vermelho', 'pimentao vermelho',
    'pimentão amarelo', 'pimentao amarelo', 'pimentão kg', 'pimentao kg',
    -- TOMATE
    'tomate', 'tomate comum', 'tomate cereja', 'tomate grape', 'tomate italiano',
    'tomate débora', 'tomate debora', 'tomate kg'
  ]) AS sinonimo
),
produtos_mapping AS (
  SELECT 
    p.id as produto_id,
    p.nome_base,
    p.nome_variacao,
    LOWER(TRIM(p.nome_base)) as nome_base_lower,
    LOWER(TRIM(COALESCE(p.nome_variacao, ''))) as nome_variacao_lower
  FROM public.produtos p
  WHERE p.ativo = true
),
sinonimos_mapeados AS (
  SELECT DISTINCT
    pm.produto_id,
    dd.sinonimo
  FROM dicionario_data dd
  CROSS JOIN produtos_mapping pm
  WHERE 
    -- Mapear para produto base exato
    (LOWER(TRIM(dd.sinonimo)) = pm.nome_base_lower)
    OR
    -- Mapear para variação específica (ex: "banana prata" -> produto "banana" variação "prata")
    (dd.sinonimo LIKE '%' || pm.nome_base_lower || '%' AND 
     pm.nome_variacao_lower != '' AND 
     dd.sinonimo LIKE '%' || pm.nome_variacao_lower || '%')
    OR
    -- Mapear sinônimos que contêm o nome base (ex: "abacatekg bola" -> "abacate")
    (dd.sinonimo LIKE '%' || pm.nome_base_lower || '%' AND pm.nome_variacao_lower = '')
)
INSERT INTO public.sinonimos_produto (produto_id, sinonimo)
SELECT produto_id, sinonimo FROM sinonimos_mapeados;