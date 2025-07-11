import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus } from 'lucide-react';

interface Produto {
  id: string;
  produto: string;
  nome_base: string | null;
  nome_variacao: string | null;
}

interface AdicionarProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedoresDisponiveis: string[];
  onProdutoAdicionado: (fornecedor: string, produto: string, tipo: string, preco: number, produtoId?: string) => void;
}

const AdicionarProdutoModal: React.FC<AdicionarProdutoModalProps> = ({
  isOpen,
  onClose,
  fornecedoresDisponiveis,
  onProdutoAdicionado
}) => {
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [preco, setPreco] = useState('');
  const [mostrarCadastroNovo, setMostrarCadastroNovo] = useState(false);
  
  // Campos para novo produto
  const [nomeNovoProduto, setNomeNovoProduto] = useState('');
  const [tipoNovoProduto, setTipoNovoProduto] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      carregarProdutos();
    }
  }, [isOpen]);

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, produto, nome_base, nome_variacao')
        .eq('ativo', true)
        .order('produto');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive"
      });
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    if (!produto) return false;
    
    const searchTerm = buscaProduto?.toLowerCase() || '';
    const produtoNome = produto.produto?.toLowerCase() || '';
    const nomeBase = produto.nome_base?.toLowerCase() || '';
    const nomeVariacao = produto.nome_variacao?.toLowerCase() || '';
    
    return produtoNome.includes(searchTerm) ||
           nomeBase.includes(searchTerm) ||
           nomeVariacao.includes(searchTerm);
  });

  const handleAdicionarProdutoExistente = () => {
    if (!fornecedorSelecionado || !produtoSelecionado || !preco) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o fornecedor, produto e informe o preço.",
        variant: "destructive"
      });
      return;
    }

    const precoNumerico = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNumerico)) {
      toast({
        title: "Preço inválido",
        description: "Informe um preço válido.",
        variant: "destructive"
      });
      return;
    }

    const nomeProduto = produtoSelecionado.nome_base || produtoSelecionado.produto;
    const tipoProduto = produtoSelecionado.nome_variacao || 'padrão';

    onProdutoAdicionado(fornecedorSelecionado, nomeProduto, tipoProduto, precoNumerico, produtoSelecionado.id);
    
    toast({
      title: "Produto adicionado",
      description: `${nomeProduto} foi adicionado à cotação.`
    });

    resetForm();
    onClose();
  };

  const handleCriarNovoProduto = async () => {
    if (!fornecedorSelecionado || !nomeNovoProduto || !tipoNovoProduto || !preco) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const precoNumerico = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNumerico)) {
      toast({
        title: "Preço inválido",
        description: "Informe um preço válido.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Criar novo produto no banco
      const { data: novoProduto, error } = await supabase
        .from('produtos')
        .insert({
          produto: nomeNovoProduto,
          nome_base: nomeNovoProduto,
          nome_variacao: tipoNovoProduto,
          ativo: true,
          observacoes: observacoes || null
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar à cotação
      onProdutoAdicionado(fornecedorSelecionado, nomeNovoProduto, tipoNovoProduto, precoNumerico, novoProduto.id);
      
      toast({
        title: "Produto criado e adicionado",
        description: `${nomeNovoProduto} foi criado e adicionado à cotação.`
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o produto.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFornecedorSelecionado('');
    setBuscaProduto('');
    setProdutoSelecionado(null);
    setPreco('');
    setMostrarCadastroNovo(false);
    setNomeNovoProduto('');
    setTipoNovoProduto('');
    setObservacoes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Produto à Cotação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Fornecedor */}
          <div>
            <Label htmlFor="fornecedor">Fornecedor *</Label>
            <Select value={fornecedorSelecionado} onValueChange={setFornecedorSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedoresDisponiveis.map((fornecedor) => (
                  <SelectItem key={fornecedor} value={fornecedor}>
                    {fornecedor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Adição */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={!mostrarCadastroNovo ? "default" : "outline"}
              onClick={() => setMostrarCadastroNovo(false)}
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Produto Existente
            </Button>
            <Button
              type="button"
              variant={mostrarCadastroNovo ? "default" : "outline"}
              onClick={() => setMostrarCadastroNovo(true)}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          {!mostrarCadastroNovo ? (
            // Seleção de produto existente
            <>
              <div>
                <Label htmlFor="busca">Buscar Produto</Label>
                <Input
                  id="busca"
                  placeholder="Digite para buscar..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                />
              </div>

              {buscaProduto && (
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  {produtosFiltrados.length > 0 ? (
                    produtosFiltrados.map((produto) => (
                      <div
                        key={produto.id}
                        className={`p-3 cursor-pointer hover:bg-muted ${
                          produtoSelecionado?.id === produto.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => setProdutoSelecionado(produto)}
                      >
                         <div className="font-medium">{produto?.nome_base || produto?.produto || 'Produto sem nome'}</div>
                         {produto?.nome_variacao && (
                           <div className="text-sm text-muted-foreground">{produto.nome_variacao}</div>
                         )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      Nenhum produto encontrado
                    </div>
                  )}
                </div>
              )}

              {produtoSelecionado && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="font-medium">Produto selecionado:</div>
                  <div>{produtoSelecionado.nome_base || produtoSelecionado.produto}</div>
                  {produtoSelecionado.nome_variacao && (
                    <div className="text-sm text-muted-foreground">{produtoSelecionado.nome_variacao}</div>
                  )}
                </div>
              )}
            </>
          ) : (
            // Cadastro de novo produto
            <>
              <div>
                <Label htmlFor="nome-produto">Nome do Produto *</Label>
                <Input
                  id="nome-produto"
                  placeholder="Ex: Maçã"
                  value={nomeNovoProduto}
                  onChange={(e) => setNomeNovoProduto(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tipo-produto">Tipo/Variação *</Label>
                <Input
                  id="tipo-produto"
                  placeholder="Ex: Gala, Fuji, Importada"
                  value={tipoNovoProduto}
                  onChange={(e) => setTipoNovoProduto(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais sobre o produto..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Preço */}
          <div>
            <Label htmlFor="preco">Preço (R$) *</Label>
            <Input
              id="preco"
              placeholder="Ex: 15,50"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={mostrarCadastroNovo ? handleCriarNovoProduto : handleAdicionarProdutoExistente}
              disabled={!fornecedorSelecionado || !preco || 
                       (!mostrarCadastroNovo && !produtoSelecionado) ||
                       (mostrarCadastroNovo && (!nomeNovoProduto || !tipoNovoProduto))}
            >
              {mostrarCadastroNovo ? 'Criar e Adicionar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarProdutoModal;