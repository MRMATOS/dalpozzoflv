-- Tabela para armazenar o aprendizado do sistema
CREATE TABLE public.sistema_aprendizado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor TEXT NOT NULL,
  texto_original TEXT NOT NULL,
  produto_extraido TEXT NOT NULL,
  tipo_extraido TEXT NOT NULL,
  preco_extraido DECIMAL,
  produto_corrigido TEXT,
  tipo_corrigido TEXT,
  preco_corrigido DECIMAL,
  feedback_qualidade INTEGER CHECK (feedback_qualidade >= 1 AND feedback_qualidade <= 5),
  aprovado BOOLEAN DEFAULT NULL,
  usuario_id UUID REFERENCES public.usuarios(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aplicado BOOLEAN DEFAULT FALSE
);

-- Índices para melhorar performance
CREATE INDEX idx_sistema_aprendizado_fornecedor ON public.sistema_aprendizado(fornecedor);
CREATE INDEX idx_sistema_aprendizado_aprovado ON public.sistema_aprendizado(aprovado);
CREATE INDEX idx_sistema_aprendizado_criado_em ON public.sistema_aprendizado(criado_em);

-- Tabela para padrões identificados automaticamente
CREATE TABLE public.padroes_fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor TEXT NOT NULL,
  padrao_texto TEXT NOT NULL,
  produto_identificado TEXT NOT NULL,
  tipo_identificado TEXT NOT NULL,
  confianca DECIMAL NOT NULL DEFAULT 0,
  ocorrencias INTEGER NOT NULL DEFAULT 1,
  ultima_ocorrencia TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para padrões
CREATE INDEX idx_padroes_fornecedores_fornecedor ON public.padroes_fornecedores(fornecedor);
CREATE INDEX idx_padroes_fornecedores_ativo ON public.padroes_fornecedores(ativo);

-- Tabela para sugestões inteligentes
CREATE TABLE public.sugestoes_inteligentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_sugestao TEXT NOT NULL, -- 'produto', 'preco', 'padrao'
  contexto JSONB NOT NULL,
  sugestao TEXT NOT NULL,
  confianca DECIMAL NOT NULL DEFAULT 0,
  aceita BOOLEAN DEFAULT NULL,
  usuario_id UUID REFERENCES public.usuarios(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sistema_aprendizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padroes_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sugestoes_inteligentes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para sistema_aprendizado
CREATE POLICY "Users can view own learning data" 
ON public.sistema_aprendizado 
FOR SELECT 
USING (usuario_id = auth.uid() OR is_user_master());

CREATE POLICY "Users can insert own learning data" 
ON public.sistema_aprendizado 
FOR INSERT 
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Masters can manage all learning data" 
ON public.sistema_aprendizado 
FOR ALL 
USING (is_user_master());

-- Políticas para padrões de fornecedores
CREATE POLICY "All users can view patterns" 
ON public.padroes_fornecedores 
FOR SELECT 
USING (true);

CREATE POLICY "Masters can manage patterns" 
ON public.padroes_fornecedores 
FOR ALL 
USING (is_user_master());

-- Políticas para sugestões inteligentes
CREATE POLICY "Users can view own suggestions" 
ON public.sugestoes_inteligentes 
FOR SELECT 
USING (usuario_id = auth.uid() OR is_user_master());

CREATE POLICY "Users can insert own suggestions" 
ON public.sugestoes_inteligentes 
FOR INSERT 
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update own suggestions" 
ON public.sugestoes_inteligentes 
FOR UPDATE 
USING (usuario_id = auth.uid() OR is_user_master());

-- Função para extrair padrões automaticamente
CREATE OR REPLACE FUNCTION public.extrair_padroes_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um feedback é aprovado, extrair padrões
  IF NEW.aprovado = true AND OLD.aprovado IS DISTINCT FROM NEW.aprovado THEN
    -- Inserir ou atualizar padrão
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

-- Trigger para extrair padrões automaticamente
CREATE TRIGGER trigger_extrair_padroes
  AFTER UPDATE ON public.sistema_aprendizado
  FOR EACH ROW
  EXECUTE FUNCTION public.extrair_padroes_fornecedor();