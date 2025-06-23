
-- 1. Adicionar campo is_cd na tabela lojas
ALTER TABLE public.lojas ADD COLUMN is_cd boolean DEFAULT false;

-- 2. Criar constraint para garantir que apenas uma loja pode ser CD
CREATE OR REPLACE FUNCTION public.validate_single_cd()
RETURNS TRIGGER AS $$
BEGIN
  -- Se estamos marcando uma loja como CD (is_cd = true)
  IF NEW.is_cd = true THEN
    -- Desmarcar todas as outras lojas como CD
    UPDATE public.lojas 
    SET is_cd = false 
    WHERE id != NEW.id AND is_cd = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar CD único
CREATE TRIGGER trigger_validate_single_cd
  BEFORE UPDATE ON public.lojas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_single_cd();

-- 3. Atualizar enum de tipos de usuário para incluir 'cd'
-- Primeiro verificar se o tipo já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'cd' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'cd';
  END IF;
END
$$;

-- 4. Criar tabela de transferências
CREATE TABLE IF NOT EXISTS public.transferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisicao_id uuid REFERENCES public.requisicoes(id),
  produto_id uuid REFERENCES public.produtos(id),
  loja_origem text NOT NULL,
  loja_destino text NOT NULL DEFAULT 'Centro de Distribuição',
  quantidade_requisitada numeric NOT NULL DEFAULT 0,
  quantidade_transferida numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  confirmado_em timestamp with time zone,
  transferido_por uuid REFERENCES public.usuarios(id),
  confirmado_por uuid REFERENCES public.usuarios(id)
);

-- 5. Função para obter a loja que é CD
CREATE OR REPLACE FUNCTION public.get_cd_loja()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT nome FROM public.lojas WHERE is_cd = true LIMIT 1;
$$;

-- 6. Função para verificar se usuário é do tipo CD
CREATE OR REPLACE FUNCTION public.is_cd_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo = 'cd'
  );
$$;

-- 7. Comentários para documentação
COMMENT ON COLUMN public.lojas.is_cd IS 'Indica se a loja é o Centro de Distribuição';
COMMENT ON FUNCTION public.validate_single_cd() IS 'Garante que apenas uma loja pode ser marcada como CD';
COMMENT ON TABLE public.transferencias IS 'Controla transferências de produtos entre lojas e CD';
COMMENT ON FUNCTION public.get_cd_loja() IS 'Retorna o nome da loja que é Centro de Distribuição';
COMMENT ON FUNCTION public.is_cd_user() IS 'Verifica se o usuário logado é do tipo CD';
