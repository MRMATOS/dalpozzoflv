-- 1) Unique index to avoid duplicate synonyms per product (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sinonimos_produto_unique
ON public.sinonimos_produto (produto_id, lower(sinonimo));

-- 2) Trigger function to auto-generate basic synonyms for products and variations
CREATE OR REPLACE FUNCTION public.auto_generate_sinonimos_produto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_produto RECORD;
  v_parent RECORD;
  base TEXT;
  variacao TEXT;
  cand TEXT[] := ARRAY[]::text[];
  s TEXT;
BEGIN
  -- Load the current product row
  SELECT * INTO v_produto FROM public.produtos WHERE id = NEW.id;

  -- Determine base and variation strings
  IF v_produto.produto_pai_id IS NOT NULL THEN
    -- Variation: get parent product name as base
    SELECT produto INTO base FROM public.produtos WHERE id = v_produto.produto_pai_id;
    variacao := COALESCE(v_produto.nome_variacao, '');
  ELSE
    -- Parent product
    base := COALESCE(v_produto.produto, COALESCE(v_produto.nome_base, ''));
    variacao := '';
  END IF;

  -- Build candidate synonyms for base
  IF COALESCE(base, '') <> '' THEN
    cand := cand || ARRAY[
      base,
      replace(base, '-', ' '),
      replace(base, ' ', '-'),
      lower(base),
      lower(replace(base, '-', ' ')),
      lower(replace(base, ' ', '-'))
    ];
  END IF;

  -- Add candidates for variation if present
  IF COALESCE(variacao, '') <> '' THEN
    cand := cand || ARRAY[
      variacao,
      replace(variacao, '-', ' '),
      replace(variacao, ' ', '-'),
      lower(variacao),
      lower(replace(variacao, '-', ' ')),
      lower(replace(variacao, ' ', '-')),
      -- Combined forms with base
      base || ' ' || variacao,
      base || '-' || variacao,
      replace(base, '-', ' ') || ' ' || variacao,
      replace(base, ' ', '-') || '-' || variacao,
      lower(base || ' ' || variacao),
      lower(base || '-' || variacao)
    ];
  END IF;

  -- Insert each candidate synonym (ignore duplicates via unique index)
  FOREACH s IN ARRAY cand LOOP
    IF COALESCE(trim(s), '') <> '' THEN
      INSERT INTO public.sinonimos_produto (produto_id, sinonimo)
      VALUES (v_produto.id, s)
      ON CONFLICT (produto_id, lower(sinonimo)) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 3) Trigger to call the function on product insert/update
DROP TRIGGER IF EXISTS trg_auto_sinonimos_produtos_ins_upd ON public.produtos;
CREATE TRIGGER trg_auto_sinonimos_produtos_ins_upd
AFTER INSERT OR UPDATE OF produto, nome_base, nome_variacao, produto_pai_id
ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_sinonimos_produto();

-- 4) Backfill: trigger generation for existing rows (fires trigger)
UPDATE public.produtos SET produto = produto;