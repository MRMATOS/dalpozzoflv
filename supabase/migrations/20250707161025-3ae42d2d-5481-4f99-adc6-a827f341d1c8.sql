-- Adicionar campos para suporte ao modo de pesagem por média
ALTER TABLE public.recebimentos 
ADD COLUMN modo_pesagem text DEFAULT 'individual' CHECK (modo_pesagem IN ('individual', 'media')),
ADD COLUMN quantidade_pallets_informada integer,
ADD COLUMN peso_total_informado numeric,
ADD COLUMN peso_medio_calculado numeric;

-- Comentários para documentação
COMMENT ON COLUMN public.recebimentos.modo_pesagem IS 'Modo de pesagem: individual (pallet por pallet) ou media (peso médio)';
COMMENT ON COLUMN public.recebimentos.quantidade_pallets_informada IS 'Quantidade de pallets informada no modo média';
COMMENT ON COLUMN public.recebimentos.peso_total_informado IS 'Peso total da pilha informado no modo média';
COMMENT ON COLUMN public.recebimentos.peso_medio_calculado IS 'Peso médio calculado (peso_total ÷ quantidade) no modo média';