-- Criar função para automaticamente gerar padrões após feedback aprovado
CREATE OR REPLACE FUNCTION auto_generate_pattern_from_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um feedback é aprovado, gerar padrão automaticamente
  IF NEW.aprovado = true AND OLD.aprovado IS DISTINCT FROM NEW.aprovado THEN
    INSERT INTO public.padroes_fornecedores (
      fornecedor,
      padrao_texto,
      produto_identificado,
      tipo_identificado,
      confianca,
      ocorrencias
    )
    VALUES (
      NEW.fornecedor,
      NEW.texto_original,
      COALESCE(NEW.produto_corrigido, NEW.produto_extraido),
      COALESCE(NEW.tipo_corrigido, NEW.tipo_extraido),
      CASE 
        WHEN NEW.feedback_qualidade >= 4 THEN 0.9
        WHEN NEW.feedback_qualidade >= 3 THEN 0.7
        ELSE 0.5
      END,
      1
    )
    ON CONFLICT (fornecedor, padrao_texto, produto_identificado, tipo_identificado) 
    DO UPDATE SET 
      ocorrencias = padroes_fornecedores.ocorrencias + 1,
      confianca = LEAST(padroes_fornecedores.confianca + 0.1, 1.0),
      ultima_ocorrencia = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para aplicar a função
DROP TRIGGER IF EXISTS trigger_auto_generate_pattern ON public.sistema_aprendizado;
CREATE TRIGGER trigger_auto_generate_pattern
AFTER UPDATE ON public.sistema_aprendizado
FOR EACH ROW
EXECUTE FUNCTION auto_generate_pattern_from_feedback();

-- Inserir alguns dados de exemplo para demonstrar o funcionamento
INSERT INTO public.sistema_aprendizado (
  fornecedor,
  texto_original,
  produto_extraido,
  tipo_extraido,
  preco_extraido,
  produto_corrigido,
  tipo_corrigido,
  feedback_qualidade,
  aprovado
) VALUES 
('Fornecedor Teste', 'mamao formosa 15kg com 1 bonificada 45,00', 'mamão', 'formosa', 45.00, 'mamão', 'formosa', 5, true),
('Fornecedor Teste', 'caqui bandeja 12,50', 'caqui', 'bandeja', 12.50, 'caqui', 'bandeja', 4, true),
('Fornecedor Teste', 'abacate 18kg 35,00', 'abacate', '18kg', 35.00, 'abacate', '18kg', 4, true);

-- Atualizar RLS para permitir leitura das estatísticas
DROP POLICY IF EXISTS "Users can view learning stats" ON public.sistema_aprendizado;
CREATE POLICY "Users can view learning stats" ON public.sistema_aprendizado
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view patterns stats" ON public.padroes_fornecedores;  
CREATE POLICY "Users can view patterns stats" ON public.padroes_fornecedores
FOR SELECT USING (true);