-- FASE 1: CORREÇÕES CRÍTICAS DE BANCO
-- Reestruturar produtos que deveriam ser pai/filho

-- 1. Criar produto pai "Ameixa" se não existir e reestruturar "Ameixa Importada"
DO $$
DECLARE
    ameixa_pai_id UUID;
    ameixa_importada_id UUID;
BEGIN
    -- Buscar se "Ameixa Importada" existe
    SELECT id INTO ameixa_importada_id FROM produtos WHERE produto = 'Ameixa Importada' LIMIT 1;
    
    IF ameixa_importada_id IS NOT NULL THEN
        -- Criar produto pai "Ameixa"
        INSERT INTO produtos (produto, nome_base, ativo, media_por_caixa, ordem_exibicao)
        VALUES ('Ameixa', 'Ameixa', true, 20, 0)
        RETURNING id INTO ameixa_pai_id;
        
        -- Transformar "Ameixa Importada" em variação
        UPDATE produtos 
        SET produto = 'Ameixa Importada',
            nome_base = 'Ameixa',
            nome_variacao = 'Importada',
            produto_pai_id = ameixa_pai_id
        WHERE id = ameixa_importada_id;
    END IF;
END $$;

-- 2. Criar produto pai "Beterraba" e reestruturar "Beterraba padrão"
DO $$
DECLARE
    beterraba_pai_id UUID;
    beterraba_padrao_id UUID;
BEGIN
    SELECT id INTO beterraba_padrao_id FROM produtos WHERE produto = 'Beterraba padrão' LIMIT 1;
    
    IF beterraba_padrao_id IS NOT NULL THEN
        INSERT INTO produtos (produto, nome_base, ativo, media_por_caixa, ordem_exibicao)
        VALUES ('Beterraba', 'Beterraba', true, 20, 0)
        RETURNING id INTO beterraba_pai_id;
        
        UPDATE produtos 
        SET produto = 'Beterraba padrão',
            nome_base = 'Beterraba',
            nome_variacao = 'padrão',
            produto_pai_id = beterraba_pai_id
        WHERE id = beterraba_padrao_id;
    END IF;
END $$;

-- 3. Corrigir "Jiló GILO" → "Jiló" pai + "GILO" variação
DO $$
DECLARE
    jilo_pai_id UUID;
    jilo_gilo_id UUID;
BEGIN
    SELECT id INTO jilo_gilo_id FROM produtos WHERE produto = 'Jiló GILO' LIMIT 1;
    
    IF jilo_gilo_id IS NOT NULL THEN
        INSERT INTO produtos (produto, nome_base, ativo, media_por_caixa, ordem_exibicao)
        VALUES ('Jiló', 'Jiló', true, 20, 0)
        RETURNING id INTO jilo_pai_id;
        
        UPDATE produtos 
        SET produto = 'Jiló GILO',
            nome_base = 'Jiló',
            nome_variacao = 'GILO',
            produto_pai_id = jilo_pai_id
        WHERE id = jilo_gilo_id;
    END IF;
END $$;

-- 4. Reestruturar "Limão VERDE" → "Limão" pai + "Verde" variação
DO $$
DECLARE
    limao_pai_id UUID;
    limao_verde_id UUID;
BEGIN
    SELECT id INTO limao_verde_id FROM produtos WHERE produto = 'Limão VERDE' LIMIT 1;
    
    IF limao_verde_id IS NOT NULL THEN
        -- Verificar se já existe produto pai "Limão"
        SELECT id INTO limao_pai_id FROM produtos WHERE produto = 'Limão' AND produto_pai_id IS NULL LIMIT 1;
        
        IF limao_pai_id IS NULL THEN
            INSERT INTO produtos (produto, nome_base, ativo, media_por_caixa, ordem_exibicao)
            VALUES ('Limão', 'Limão', true, 20, 0)
            RETURNING id INTO limao_pai_id;
        END IF;
        
        UPDATE produtos 
        SET produto = 'Limão Verde',
            nome_base = 'Limão',
            nome_variacao = 'Verde',
            produto_pai_id = limao_pai_id
        WHERE id = limao_verde_id;
    END IF;
END $$;

-- 5. Reestruturar "Milho verde" → "Milho" pai + "Verde" variação
DO $$
DECLARE
    milho_pai_id UUID;
    milho_verde_id UUID;
BEGIN
    SELECT id INTO milho_verde_id FROM produtos WHERE produto = 'Milho verde' LIMIT 1;
    
    IF milho_verde_id IS NOT NULL THEN
        INSERT INTO produtos (produto, nome_base, ativo, media_por_caixa, ordem_exibicao)
        VALUES ('Milho', 'Milho', true, 20, 0)
        RETURNING id INTO milho_pai_id;
        
        UPDATE produtos 
        SET produto = 'Milho Verde',
            nome_base = 'Milho',
            nome_variacao = 'Verde',
            produto_pai_id = milho_pai_id
        WHERE id = milho_verde_id;
    END IF;
END $$;

-- 6. Uniformizar nomenclaturas problemáticas
UPDATE produtos SET produto = 'Cheiro-verde' WHERE produto = 'Cheiro verde';
UPDATE produtos SET produto = 'Tâmara' WHERE produto = 'Tamara';
UPDATE produtos SET produto = 'Físalis' WHERE produto = 'Physalis';

-- 7. Criar produto pai para produtos que têm variações mas não têm pai
DO $$
DECLARE
    produto_record RECORD;
    pai_id UUID;
BEGIN
    -- Encontrar produtos com nome_base mas sem produto_pai_id
    FOR produto_record IN 
        SELECT DISTINCT nome_base 
        FROM produtos 
        WHERE nome_base IS NOT NULL 
        AND produto_pai_id IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM produtos p2 
            WHERE p2.produto = produtos.nome_base 
            AND p2.produto_pai_id IS NULL
        )
    LOOP
        -- Criar produto pai
        INSERT INTO produtos (produto, nome_base, ativo, media_por_caixa, ordem_exibicao)
        VALUES (produto_record.nome_base, produto_record.nome_base, true, 20, 0)
        RETURNING id INTO pai_id;
        
        -- Atualizar filhos para referenciar o pai
        UPDATE produtos 
        SET produto_pai_id = pai_id 
        WHERE nome_base = produto_record.nome_base 
        AND produto_pai_id IS NULL
        AND produto != produto_record.nome_base;
    END LOOP;
END $$;