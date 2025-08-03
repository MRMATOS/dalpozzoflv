documentação da extração de produtos na cotação

## Visão geral

Esta documentação descreve o comportamento atual do sistema de cotação, problemas identificados, testes realizados e sugestões de correções para melhorar o processo de identificação e associação dos produtos e suas variações.

## Comportamento atual observado

### Associações corretas identificadas

- **Produto com variação existente**:
  - Exemplo: Produto "abacaxi-havaí" foi corretamente identificado, mesmo com variação escrita como "Hawaí". O sistema reconheceu corretamente "Hawaí" como "Havaí".

### Os problemas identificados

1. **Associação incorreta ao criar variação "padrão" artificialmente**:

   - Quando o fornecedor envia um produto sem variação, o sistema está adicionando artificialmente a palavra "padrão".
   - Exemplo: Produto "abobrinha" sem variação está associando incorretamente à "cenoura padrão" por falta da variação específica cadastrada no produto.

2. **Associação incorreta de variações existentes**:

   - Exemplo: Produto "banana-caturra" sendo associado erroneamente à variação “Nanica".
   - Causa: "banana-caturra" não estava cadastrada como uma variação independente, e estava dentro da variação “Nanica" no arquivo de dicionário (dicionario`produto.ts`).

3. **Falta de associação correta ao produto pai**:

   - Exemplo: Produto "laranja Bahia" deveria se associar ao produto pai "laranja" quando a variação específica não existe. Atualmente fica como NULL.

4. **Erros por falta de variações cadastradas**:

   - Produtos como "Acelga", "Batata Inhame (Yame)", “Caqui Chocolate", "Goiaba Garauda" e "Melão Melícia" precisam ter suas variações adicionadas manualmente para evitar associações incorretas ou artificiais.

## Testes realizados e resultados

| Teste                                                         | Resultado                                         |
| ------------------------------------------------------------- | ------------------------------------------------- |
| Mudança ortográfica na variação (ex: Havaí → Hawái)           | Sucesso, o sistema reconheceu corretamente        |
| Adicionar variação "padrão" ao produto pai (abobrinha)        | Sucesso, evitou associação incorreta à cenoura    |
| Adicionar manualmente variação "banana-caturra" no dicionário | Sucesso, associou corretamente a "banana-caturra" |
| Adicionar "Bahia Nacional" à variação "laranja"               | Necessário, evita NULL                            |
| Adicionar "Melícia" à variação "melão"                        | Sucesso, evitou adição da palavra "padrão"        |

## Recomendações técnicas para melhorias

### Lógica sugerida para extração

- O sistema deve identificar primeiramente o produto pai.
- Após identificação do produto pai, o sistema deve buscar variações exclusivamente dentro das variações cadastradas desse produto pai.
- Caso não encontre correspondência na mensagem do fornecedor com as variações cadastradas, o sistema deve associar ao produto pai diretamente, sem adicionar a palavra "padrão".

Exemplo correto:

- Fornecedor envia "alface crespa" → Produto pai "alface" identificado → Variação "crespa" existe → Associação correta "alface crespa".
- Fornecedor envia "ameixa importada" → Produto pai "ameixa" identificado → Verifica se "importada" existe nas variações de "ameixa" → Se sim, "ameixa importada"; se não, "ameixa".

### Correções e melhorias adicionais na interface

- Permitir a correção rápida de associação diretamente na interface da cotação (igual ao ajuste de preços).
- O botão de adição de variações diretamente no cadastro do produto deve ser corrigido para funcionar corretamente (atualmente está inoperante).

## Próximos passos para base de conhecimento

- Incluir mensagens reais dos fornecedores para entender variações ortográficas e nomes alternativos.
- Criar um dicionário robusto de sinônimos para facilitar a associação correta de produtos.
- Manter histórico de correções feitas pelos usuários para o sistema aprender e otimizar automaticamente futuras associações.\
  \
  Abaixo, as mensagens dos fornecedores para entender como eles enviam e escrevem, para tratar corretamente os produtos:\
  \
  \*\*Preços para segunda feira \*\*

  \


  Preços para volume com nota e boleto

  \


   

  Caqui fuiu ext g 20 kg 80 gaúcho 

  Caqui fuiu g 20 kg 72.00

  Abacaxi pérola tipo 10 58.00 ( 15-17,5 KG )

  Abacaxi Hawai tipo 10 67,00 ( 18-20 KG ) 

  Atemoia 10 kg 140.00

  Papaia 10 kg TAM 20  90.00  com 1 cx bonificada 

  Papaia 10 kg TAM 24  85.00 com 1 cx bonificada 

  mamao formosa  15 Kg 63.00 com 1 bonificada 

  Coco seco 14 kg  115.00 Sc 

  Manga tomy 20 kg 128.00

  Manga pálmer 20 kg 128.00

  Pepino japonês 20 KG 96.00

  pepino salada 20 kg 65.00

  Pepino alday 20 kg 58.00

  Alface crespa Kael 

  Alface americana kael 

  Chuchu 20 kg 30.00

  Laranja Bahia imp  

  Laranja Bahia imp ( só vou ter TAM 48 da nova 65.00

  Laranja Bahia 20 KG 70.00 

  Ameixa importada 9 KG 175pp

  Pêssego 

  Nectarina 

  Laranja lima 20 KG 80.00

  Cenoura 20 KG 36.00

  Cenoura média 1.10 KG 

  Beterraba selecionada  20 kg 35.00

  Batata doce roxa graúda 20 kg 30.00

  Tomate longa vida 

  Saladete graúdo 

  Laranja pera rio 20 kg 57.00

  Morgote graúda 

  Pimentão verde médio/graúdo 10 kg 52.00

  Pimentão vermelho  médio/graudo 10 KG 143.00

  Pimentão amarelo  medio/graudo 10 KG 160.00

  Batata inhame 20 kg 80.00

  Maçã Monica 190.00

  Tâmara 25 bdj de 200 gr 100.00

  Abacate fortuna 95.00

  Quiabo 

  Vagem branca 10 kg 55.00

  Abobora pescoço 1.90 kg 

  Abobrinha verde 20 kg 90.00

  Maracujá médio 12 kg  70.00

  Maracujá graúdo 11 kg 68.00

  gengibre placa 12 KG 130.00

  Kiwi imp 9 kg graúdo 180.00 calibre 20/25 importado 

  Kiwi bdj 20x600 gr 190.00

  Uva thompson doçura do vale 

  Uva thompson uvas do campo 90.00

  Uva vitória uvas do campo 65.00

  Beringela 4.90 kg 

  Limão siciliano 130.00 cx 15 KG TAM 100 cat 1 

  Limão graúdo 68.00 cx com 20 kg 

  Repolho verde  30.00 ( 20 KG com caixa ) 

  Repolho roxo 45.00 ( 18-20 kg com caixa ) 

  Pera Willians 

  Pera danju 18 kg TAM 80/90/100 130.00

  Melão sapo 

  Melão rei TAM 6/7 95.00

  Melão cepi TAM 6 63.00

  Melão Gaia 13-15 KG TAM 9 45.00

  Melão melícia TAM 8/9 

  13/14 KG 45.00

  TôMate cereja  

  Tômate cereja 

  Pimenta dedo 

  Goiaba 20 kg 120.00

  Pitaya 

  Maçã 🍏 220.00 18 kg cat 1 TAM 72/80

  Mirtilo 140.00

  Physalis 80.00

  \


  Bom dia 

  \


  Segue os preço p 16/06

  Abacaxi Hawai t10  com 17 kg 7,90

  Abóbora seca 2.20

  Abobrinha padrão 5,10

  Acelga padrão 4,00 unidade

  Alface crespa 2,00

  Americana  unidade 3.00

  Batata Asterix 3.50

  Batata doce roxa padrão 1.70

  Berinjela 5,30

  Beterraba 1.70 padrão top

  Cabotia 3.00

  Cebola roxa 5,90 cx3 importada top

  Cenoura 1.70 top 

  Chuchu 1.30

  Gengibre 12.00

  Mamão formosa 3.60  abrindo   cor de pé t10 ou 12 

  Mamão papaia t20   8,50  kg 

  Manga tommy padrão  7,50 Rio sul 

  Manga palmer baía 6,50

  Maracujá graúdo  9,90

  Pepino salada top 3.85 

  Pepino japonês  Klaina padrão 5,20

  Pimentão amarelo graúdo klaina 15,50

  Pimentão verde graúdo  5,40

  Pimentão vermelho graúdo 13.60

  Repolho roxo 5,90 kg 

  Repolho verde 1.50 kg  

  Tomate cereja 4,80  klaina 

  Vagem 9,90

  Ponkan 3.30  kg

  Tomate saladete graúdo 7,50

  Tomate longa vida graúdo 6,50

  Laranja pera 2.60 kg

  \


  Abacaxi Havaí tp t 10  1.700 70.00

  Abacate  kg breda 4.75kg

  Abacatekg bola 

  Abacaxi pérola t 10   1.700 58.00

  Ameixa nacional g 

  Ameixa imp. kg  calibre 65 145.00

  Banana plástica  13kg 27.00

  \


  Banana katurra 2.00

  Banana maçã 

  Banana ouro 9.00

  Banana terra 8.50

  Banana Prata 4.40

  Banana maçã 

  Atemoia  

  Coco seco 8.50kg

  Coco verde  6.00

  Goiaba graúda  6.50

  Laranja fabi  5.50

  Laranja pera rio ceasa 

  Laranja pera  roça 2.40 amarela

  Laranja lima 4.50

  Laranja Bahia  nacional 4.50

  Laranja Bahia imp t 56 

  Laranja imp valência 

  Limão g 3.60

  Limão 

  Mamão formosa kg 3.50

  Mamão roça 

  Mamão papaya t 24 

  Mamão Papaya 70 .00 t 20 e 15 10kg

  \


  Manga espada 

  Manga tomy 130.00

  manga palmer 140.00

  Maçã importada 

  Maçã pinki 

  Maçã fugi

  Maçã gala 

  Maracujá kg 8.00

  Maracujá

  Melão 

  Melão

  Melão cepi cx t6 65.00

  Melão rei t 6 100.00  

  Melancia baby cx .t 6

  Morango

  Murgote  graúda  

  Mixixrica 

  Nectarina imp 8kg 

  Pêssego  importado 

  Pêssego nacional g 

  Tangerina olé 

  Ponkan  cerro 2.50kg

  Ponkan fabi

  Pera nacional 

  Pera imp   

  Kiwi nacional 

  Kiwi imp.t 20 10kg 188.00

  Caqui fuiu gg 4.50

  Caqui chocolate 6.50

  Uva rosa 

  Uva rubi 

  Uva Brasil 

  Uva Itália  

  Uva tompsom  bemdoce 98.00

  Uva Vitória  bem doce 

  \


   

  \


  Abobrinha  4.90

  Abóbora moranga 2.00

  Abóbora cabutia  2.00

  Acelga 30.00 cx c 8

  Alho Poró mç com12t 50.00

  Alho descascado 1kg 30.00

  Alface  crespa grauda 35.00

  Alface crespa  

  Americana  cx 45.00 idosk

  Alface Americana 

  Agrião 2.75

  Batata yame 4.50

  Batata especial 120.00 25kg

  Batata doce 2.10

  Doce miuda 1.00

  Batata doce branca 

  Batata salsa bdj 

  Batata salsa kg  4.50

  Batata salsa 

  Berinjela 5.90

  Beterraba 1.75

  Beterraba m

  Brocolis bdj 

  Brócolis 65.00 

  Cebola nacional cx

  Cebola roxa 20kg 120.00

  Cheiro Verde 

  Cenoura boa kg 1.75

  Cenoura m 1.00

  Chuchu kg 1.25

  Couve-flor 58.00

  Couve maço

  Escarola 40.00 cx c 18

  Espinafre  unidades 

  Gengibre  10.00

  Hortelã band 3.00

  Milho verde c 4.  5.50

  Milho verde c3.  4.20

  Pepino salada 3.35

  Pepino japonês 5.25

  Pimeta Cambuci 12.00

  Pimenta dedo moça 16.50

  Pimentão verde   5.50

  Pimentão vermelho 17.00

  Pimentão amarelo 17.00

  Quiabo 14.00kg

  Rabanete  padrão kg 

  Rabanete mç 3.50

  Repolho verde 30.00

  Repolho roxo 35.00cx 18kg

  Tomate longa vida graudo 6.50

  Tomate longa vida m  6.00

  \


  Tomate saladete 7.75

  Tomate cereja 

  Tomate cereja  3.50

  Vagem 7.50

  Tamara 100.00 c 25

  Pitaya 1200

  \


  Banana terra 7,40

  Coco seco 8,20 Bahia 

  Abacaxi pérola 10 62,00

  Melão amarelo graúdo 2,50 top t 6/7 com 15 kg cx plástica 

  Melão sapo graúdo 3,30

  Coco verde 4,70

  Limão G 3,50

  Mamão formosa top 3,50

  Mamão papaia 7,50 top verdinho abrindo cor

  Manga tomy top vale bonito 7,00

  Manga tomy Fiorese 6,40

  Manga Palmer 6,50

  Maracujá papelão 

  Maracujá plástica top 6,20

  Abobrinha LV 4,55

  Abobrinha klaina 

  Abobrinha Colombense 

  Batata doce top graúda 1,60

  Beterraba produtor 

  Beterraba box 1,75

  Cenoura top 1,80

  Chuchu klaina 1,20

  Chuchu morretense 

  Pepino salada 3,65

  Pepino japonês klaina 5,25

  Pepino japonês LeV 4,90

  Pimentão verde klaina graúdo 4,85

  Pimentão verde região 

  Pimentão vermelho 14,00

  Pimentão amarelo 16,00

  Tomate cereja klaina 4,50

  Tomate cereja cavali 3,90

  Berinjela 5,00

  Couve flor média p/graúda 6,00

  Abóbora pescoço 

  Abóbora menina 1,90

  Moranga 1,90

  Cabotia graúdo 1,90

  Gengibre novo top 9,00

  Vagem 6,30

  Laranja lima  4,00

  Pimenta vermelha

  Alho poró 15,50

  Cambuci 

  Quiabo 

  Gilo 5,90

  Laranja 2,75

  Milho verde 4,50 top

  Pitaya 

  Atemoia 10,60

  Repolho verde top 1,50 kg

  Repolho roxo 2,40 kg

  \


  Ponkan terça cedo 2,25

  Colhida na segunda feira

  \


  Abacaxi Havaí tp t 10  1.700 70.00

  Abacate  kg breda 4.75kg

  Abacatekg bola 

  Abacaxi pérola t 10   1.700 68.00

  Ameixa nacional g 

  Ameixa imp. kg  calibre 65 145.00

  Banana plástica  13kg 27.00

  \


  Banana katurra 2.00

  Banana maçã 

  Banana ouro 9.00

  Banana terra 8.50

  Banana Prata 4.40

  Banana maçã 

  Atemoia  

  Coco seco 8.50kg

  Coco verde  6.00

  Goiaba graúda  6.50

  Laranja fabi  5.50

  Laranja pera rio ceasa 

  Laranja pera  roça 2.40 amarela

  Laranja lima 4.50

  Laranja Bahia  nacional 4.50

  Laranja Bahia imp t 56 

  Laranja imp valência 

  Limão g 3.75

  Limão 

  Mamão formosa kg 3.50

  Mamão roça 

  Mamão papaya t 24 

  Mamão Papaya 70 .00 t 20 e 15 10kg

  \


  Manga espada 

  Manga tomy 155.00

  manga palmer 140.00

  Maçã importada 

  Maçã pinki 

  Maçã fugi

  Maçã gala 

  Maracujá kg 8.00

  Maracujá

  Melão 

  Melão

  Melão cepi cx t6 65.00

  Melão rei t 6 100.00  

  Melancia baby cx .t 6

  Morango

  Murgote  graúda  

  Mixixrica 

  Nectarina imp 8kg 

  Pêssego  importado 

  Pêssego nacional g 

  Tangerina olé 

  Ponkan  cerro 2.50kg

  Ponkan fabi

  Pera nacional 

  Pera imp   

  Kiwi nacional 

  Kiwi imp.t 20 10kg 188.00

  Caqui fuiu gg 4.50

  Caqui chocolate 6.50

  Uva rosa 

  Uva rubi 

  Uva Brasil 

  Uva Itália  

  Uva tompsom  bemdoce 98.00

  Uva Vitória  bem doce 

  \


   

  \


  Abobrinha  4.25

  Abóbora moranga 2.00

  Abóbora cabutia  2.00

  Acelga 30.00 cx c 8

  Alho Poró mç com12t 50.00

  Alho descascado 1kg 30.00

  Alface  crespa grauda 35.00

  Alface crespa  

  Americana  cx 45.00 idosk

  Alface Americana 

  Agrião 2.75

  Batata yame 4.50

  Batata especial 120.00 25kg

  Batata doce 2.10

  Doce miuda 1.00

  Batata doce branca 

  Batata salsa bdj 

  Batata salsa kg  4.50

  Batata salsa 

  Berinjela 5.90

  Beterraba 1.75

  Beterraba m

  Brocolis bdj 

  Brócolis 65.00 

  Cebola nacional cx

  Cebola roxa 20kg 110.00

  Cheiro Verde 

  Cenoura boa kg 1.75

  Cenoura m 1.00

  Chuchu kg 1.25

  Couve-flor 58.00

  Couve maço

  Escarola 40.00 cx c 18

  Espinafre  unidades 

  Gengibre  10.00

  Hortelã band 3.00

  Milho verde c 4.  5.50

  Milho verde c3.  4.20

  Pepino salada 3.50

  Pepino japonês 5.50

  Pimeta Cambuci 12.00

  Pimenta dedo moça 16.50

  Pimentão verde   5.50

  Pimentão vermelho 17.00

  Pimentão amarelo 17.00

  Quiabo 14.00kg

  Rabanete  padrão kg 

  Rabanete mç 3.50

  Repolho verde 30.00

  Repolho roxo 35.00cx 18kg

  Tomate longa vida graudo 6.50

  Tomate longa vida m  6.00

  \


  Tomate saladete 7.75

  Tomate cereja 

  Tomate cereja  3.50

  Vagem 6.80

  Tamara 100.00 c 25

  Pitaya 1200

  \


  Banana terra 7,40

  Coco seco 8,20 Bahia 

  Abacaxi pérola 10 68,00

  Melão amarelo graúdo 2,50 top t 6/7 com 15 kg cx plástica 

  Melão sapo graúdo 3,30

  Coco verde 4,70

  Limão G 3,60

  Mamão formosa top 3,50

  Mamão papaia 5,70 top verdinho abrindo cor

  Manga tomy top rio sul 7,40

  Manga tomy Fiorese 7,00 

  Manga Palmer 6,75

  Maracujá papelão 

  Maracujá plástica top 7,00

  Abobrinha LV 3,70

  Abobrinha klaina 4,00

  Abobrinha Colombense 

  Batata doce top graúda 1,60

  Beterraba produtor 

  Beterraba box 1,75

  Cenoura top 1,80

  Chuchu klaina 1,20

  Chuchu morretense 

  Pepino salada 3,40

  Pepino japonês klaina 5,25

  Pepino japonês LeV 4,50

  Pimentão verde klaina graúdo 4,95

  Pimentão verde região 

  Pimentão vermelho 15,50

  Pimentão amarelo 16,50

  Tomate cereja klaina 4,50

  Berinjela 6,20

  Couve flor média p/graúda 

  Abóbora pescoço 

  Abóbora menina 1,90

  Moranga 1,90

  Cabotia graúdo 1,90

  Gengibre novo top 9,00

  Vagem 7,00

  Laranja lima  4,00

  Pimenta vermelha

  Alho poró 15,50

  Cambuci 

  Quiabo 18,50

  Gilo 

  Laranja 2,75

  Milho verde 4,30

  Pitaya 

  Atemoia 11,00

  Repolho verde top 1,60 kg

  Repolho roxo 2,40 kg

  \


  Banana terra 7,40

  Coco seco 8,20 Bahia 

  Abacaxi pérola 10 61,00

  Melão amarelo graúdo 2,60 top t 6/7 com 15 kg cx plástica 

  Melão sapo bom 

  Coco verde 5,00

  Limão G 2,20 top

  Mamão formosa top 3,10

  Mamão papaia 5,20 top verdinho abrindo cor

  Manga tomy top rio sul 7,55

  Manga tomy top vale bonito 

  Manga Palmer 5,85

  Maracujá papelão 

  Maracujá plástica top 6,80

  Abobrinha LV 1,75

  Abobrinha klaina 1,80

  Abobrinha Colombense 1,65

  Batata doce top graúda 1,70

  Beterraba produtor 

  Beterraba box 2,00

  Cenoura top 1,80

  Chuchu klaina 0,90

  Chuchu morretense 1,25

  Pepino salada 2,50

  Pepino japonês klaina 2,20

  Pimentão verde klaina 4,80

  Pimentão verde região fresco produtor 4,20

  Pimentão vermelho 8,60

  Pimentão amarelo 8,60

  Tomate cereja klaina 4,50

  Berinjela 3,80

  Couve flor média p/graúda  4,60

  Abóbora pescoço 

  Abóbora menina 1,80

  Moranga 1,75

  Cabotia graúdo 1,90

  Gengibre novo top 9,00

  Vagem 5,40

  Laranja lima  4,40

  Pimenta vermelha 12,50

  Alho poró 15,50

  Cambuci 5,40

  Quiabo 14,50

  Gilo 5,30

  Laranja 3,30

  Milho verde 4,30

  Pitaya 9,80

  Atemoia 8,00

  \


  Bom dia 

  \


  Segue os preço p 26/05

  Abacaxi Hawai t10  com 17 kg 8,90

  Abóbora seca 1.90

  Abobrinha padrão 2.00

  Acelga padrão 5,00 unidade

  Alface crespa 3.00

  Americana  3.50

  Batata Asterix 4,00

  Batata doce roxa 1.90

  Berinjela 4,30

  Beterraba 1.90 padrão top

  Cabotia 3.00

  Cebola roxa 6,70 cx3 importada top

  Cenoura 1.90  top 

  Chuchu 0,90

  Gengibre 15,00

  Mamão formosa 3.60 abrindo   cor de pé t10 ou 12 

  Mamão papaia t20   5,30 kg 

  Manga tommy padrão  7,50Rio sul  

  Manga palmer baía 6,30

  Maracujá graúdo  11.90

  Pepino salada top 2.10

  Pepino japonês  Klaina padrão 2.30

  Pimentão amarelo graúdo klaina 8,30

  Pimentão verde graúdo  5,40

  Pimentão vermelho graúdo 8,30

  Repolho roxo 5,90 kg 

  Repolho verde 1.80  kg  

  Tomate cereja 5,00  klaina 

  Vagem 7,90

  Ponkan 2.20 kg

  Milho verde klaina com 4 espigas 4,50 

  Tomate saladete graúdo 6,90

  Tomate longa vida graúdo 6,50\
  \


