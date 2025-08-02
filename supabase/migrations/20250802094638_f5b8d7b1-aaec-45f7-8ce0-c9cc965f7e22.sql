-- Criar tabela para sistema de aprendizado da extração
CREATE TABLE IF NOT EXISTS public.aprendizado_extracao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  termo_original TEXT NOT NULL,
  produto_correto_id UUID REFERENCES public.produtos(id),
  fornecedor TEXT NOT NULL,
  confidence INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_aprendizado_termo_original ON public.aprendizado_extracao(termo_original);
CREATE INDEX IF NOT EXISTS idx_aprendizado_fornecedor ON public.aprendizado_extracao(fornecedor);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_aprendizado_extracao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_aprendizado_extracao_updated_at
  BEFORE UPDATE ON public.aprendizado_extracao
  FOR EACH ROW
  EXECUTE FUNCTION update_aprendizado_extracao_updated_at();

-- RLS policies
ALTER TABLE public.aprendizado_extracao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar aprendizados" ON public.aprendizado_extracao
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir aprendizados" ON public.aprendizado_extracao
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar aprendizados" ON public.aprendizado_extracao
  FOR UPDATE USING (true);