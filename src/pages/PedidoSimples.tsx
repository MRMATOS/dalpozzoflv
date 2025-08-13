import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useProdutosComPai } from "@/hooks/useProdutosComPai";
import { usePedidosCompradores } from "@/hooks/usePedidosCompradores";
import NovoFornecedorModal from "@/components/pedidos/NovoFornecedorModal";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  Plus, 
  Calendar as CalendarIcon, 
  Search,
  History,
  Package,
  User,
  Calculator,
  Trash2,
  CheckCircle2
} from "lucide-react";

interface PedidoSimples {
  id: string;
  fornecedor_nome: string;
  produto_nome: string;
  unidade: string;
  tipo?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total_estimado: number;
  data_pedido: string;
  data_prevista?: string;
  data_recebimento?: string;
  status_entrega?: string;
  criado_em: string;
  observacoes?: string;
}

const PedidoSimples = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fornecedores } = useFornecedores('pedido_simples');
  const { produtos } = useProdutosComPai();
  const { 
    pedidos: historicoCompleto, 
    compradores, 
    loading: loadingCompradores,
    buscarPedidos,
    marcarComoRecebido: marcarRecebidoService,
    excluirPedido: excluirPedidoService,
    excluirPedidosFornecedor: excluirFornecedorService
  } = usePedidosCompradores();
  
  // Estado do formulário
  const [fornecedor, setFornecedor] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [produtoId, setProdutoId] = useState("");
  const [unidade, setUnidade] = useState("Caixa");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [mediaPorCaixa, setMediaPorCaixa] = useState("");
  const [dataPrevista, setDataPrevista] = useState<Date>(new Date());
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalFornecedor, setModalFornecedor] = useState(false);
  
  // Estado do histórico com filtros melhorados
  const [filtrosHistorico, setFiltrosHistorico] = useState({
    comprador: 'meus' as 'todos' | 'meus' | string,
    fornecedor: "todos",
    produto: "",
    dataInicio: "",
    dataFim: ""
  });

  // Calcular valor total estimado
  const calcularTotal = () => {
    const qtd = parseFloat(quantidade) || 0;
    const valor = parseFloat(valorUnitario) || 0;
    const media = parseFloat(mediaPorCaixa) || 0;
    
    if (qtd === 0 || valor === 0) return 0;
    
    // Se valor <= 14,99 E unidade for "Caixa", multiplicar por média_kg_caixa
    if (valor <= 14.99 && media > 0 && unidade === 'Caixa') {
      return valor * media * qtd;
    } else {
      return valor * qtd;
    }
  };

  // Função para atualizar média por caixa no produto
  const atualizarMediaPorCaixa = async (novaMedia: string) => {
    if (!produtoId || !novaMedia) return;
    
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ media_por_caixa: parseFloat(novaMedia) })
        .eq('id', produtoId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar média por caixa:', error);
    }
  };

  // Carregar média por caixa quando produto for selecionado
  const handleProdutoChange = (produtoIdSelecionado: string) => {
    setProdutoId(produtoIdSelecionado);
    const produtoSelecionado = produtos.find(p => p.id === produtoIdSelecionado);
    if (produtoSelecionado?.media_por_caixa) {
      setMediaPorCaixa(produtoSelecionado.media_por_caixa.toString());
    } else {
      setMediaPorCaixa('');
    }
  };

  // Função para criar novo fornecedor
  const handleNovoFornecedor = (novoFornecedor: { id: string; nome: string; telefone?: string; status_tipo?: string }) => {
    setFornecedorId(novoFornecedor.id);
    setFornecedor(novoFornecedor.nome);
  };

  const valorTotal = calcularTotal();

  // Busca inteligente de fornecedor
  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(fornecedor.toLowerCase())
  );

  // Preparar opções para o Combobox de produtos (incluindo variações)
  const produtoOptions = produtos.map(produto => ({
    value: produto.id!,
    label: produto.display_name || produto.produto || ''
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor || !produtoId || !quantidade || !valorUnitario) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      let fornecedorFinalId = fornecedorId;
      
      // Se fornecedor não existe, verificar se já existe com nome similar e criar se necessário
      if (!fornecedorId && fornecedor) {
        // Primeiro, verificar se já existe um fornecedor com nome similar
        const { data: fornecedoresExistentes } = await supabase
          .from('fornecedores')
          .select('id, nome')
          .ilike('nome', fornecedor.trim());

        if (fornecedoresExistentes && fornecedoresExistentes.length > 0) {
          // Se encontrou fornecedor com nome similar, usar o existente
          const fornecedorExistente = fornecedoresExistentes[0];
          fornecedorFinalId = fornecedorExistente.id;
          setFornecedor(fornecedorExistente.nome);
          setFornecedorId(fornecedorExistente.id);
          
          toast.info(`Usando fornecedor existente: "${fornecedorExistente.nome}"`);
        } else {
          // Criar novo fornecedor apenas se não existir similar
          const { data: novoFornecedor, error: errorFornecedor } = await supabase
            .from('fornecedores')
            .insert({
              nome: fornecedor.trim(),
              status_tipo: 'Pedido Simples'
            })
            .select()
            .single();

          if (errorFornecedor) throw errorFornecedor;
          fornecedorFinalId = novoFornecedor.id;
          
          toast.success(`Fornecedor "${fornecedor}" cadastrado automaticamente`);
        }
      }

      const produtoSelecionado = produtos.find(p => p.id === produtoId);

      // Inserir pedido simples
      const { error } = await supabase
        .from('pedidos_simples')
        .insert({
          fornecedor_id: fornecedorFinalId,
          fornecedor_nome: fornecedor,
          produto_id: produtoId,
          produto_nome: produtoSelecionado?.display_name || produtoSelecionado?.produto || '',
          unidade,
          quantidade: parseFloat(quantidade),
          valor_unitario: parseFloat(valorUnitario),
          valor_total_estimado: valorTotal,
          data_pedido: format(new Date(), 'yyyy-MM-dd'), // Data atual como data do pedido
          data_prevista: format(dataPrevista, 'yyyy-MM-dd'), // Data selecionada pelo usuário
          user_id: user?.id,
          criado_por: user?.id,
          observacoes
        });

      if (error) throw error;

      toast.success("Pedido simples registrado com sucesso!");
      
      // Limpar formulário (mantém fornecedor selecionado)
      setProdutoId("");
      setQuantidade("");
      setValorUnitario("");
      setObservacoes("");
      setDataPrevista(new Date());
      
      // Atualizar histórico se estiver na aba histórico
      buscarPedidos(filtrosHistorico);
      
    } catch (error: any) {
      console.error('Erro ao registrar pedido:', error);
      toast.error(error.message || "Erro ao registrar pedido");
    } finally {
      setLoading(false);
    }
  };

  // Carregar histórico usando o novo hook
  const carregarHistorico = () => {
    buscarPedidos(filtrosHistorico);
  };

  const selecionarFornecedor = (fornecedorSelecionado: any) => {
    setFornecedor(fornecedorSelecionado.nome);
    setFornecedorId(fornecedorSelecionado.id);
  };

  // Agrupar histórico por fornecedor
  const historicoPorFornecedor = historicoCompleto.reduce((acc, pedido) => {
    const fornecedor = pedido.fornecedor_nome;
    if (!acc[fornecedor]) {
      acc[fornecedor] = [];
    }
    acc[fornecedor].push(pedido);
    return acc;
  }, {} as Record<string, PedidoSimples[]>);

  // Calcular total por fornecedor
  const calcularTotalFornecedor = (pedidos: PedidoSimples[]) => {
    return pedidos.reduce((total, pedido) => total + pedido.valor_total_estimado, 0);
  };

  // Obter fornecedores únicos do histórico para o dropdown
  const fornecedoresUnicos = Array.from(
    new Set(historicoCompleto.map(p => p.fornecedor_nome))
  ).sort();

  // Função para excluir pedido individual
  const excluirPedido = async (pedidoId: string) => {
    const sucesso = await excluirPedidoService(pedidoId);
    if (sucesso) {
      toast.success("Pedido excluído com sucesso!");
      carregarHistorico();
    } else {
      toast.error("Erro ao excluir pedido");
    }
  };

  // Função para excluir todos os pedidos de um fornecedor
  const excluirPedidosFornecedor = async (nomeFornecedor: string) => {
    const quantidade = await excluirFornecedorService(nomeFornecedor);
    if (quantidade > 0) {
      toast.success(`${quantidade} pedidos do fornecedor "${nomeFornecedor}" foram excluídos!`);
      carregarHistorico();
    } else {
      toast.error("Nenhum pedido encontrado para este fornecedor ou erro na operação");
    }
  };

  // Função para marcar pedido como recebido
  const marcarComoRecebido = async (pedidoId: string) => {
    const sucesso = await marcarRecebidoService(pedidoId);
    if (sucesso) {
      toast.success("Pedido marcado como recebido!");
      carregarHistorico();
    } else {
      toast.error("Erro ao marcar como recebido");
    }
  };

  // Função para obter configuração de status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pontual':
        return { 
          icon: '✅', 
          label: 'Pontual', 
          className: 'bg-green-100 text-green-800 border-green-200' 
        };
      case 'atrasado':
        return { 
          icon: '⚠️', 
          label: 'Atrasado', 
          className: 'bg-red-100 text-red-800 border-red-200' 
        };
      case 'adiantado':
        return { 
          icon: '⏱️', 
          label: 'Adiantado', 
          className: 'bg-blue-100 text-blue-800 border-blue-200' 
        };
      case 'pendente':
      default:
        return { 
          icon: '⏳', 
          label: 'Pendente', 
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <div className="h-6 border-l border-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Pedido Simples</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="novo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="novo" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Novo Pedido</span>
            </TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="flex items-center space-x-2"
              onClick={carregarHistorico}
            >
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="novo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Registrar Pedido Simples</span>
                </CardTitle>
                <CardDescription>
                  Registre pedidos rápidos feitos diretamente com fornecedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Primeira linha: Fornecedor e Produto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Fornecedor Unificado */}
                    <div className="space-y-2">
                      <Label htmlFor="fornecedor">Fornecedor *</Label>
                      <Combobox
                        options={[
                          { value: 'novo', label: '➕ Novo Fornecedor' },
                          ...fornecedores.map(f => ({
                            value: f.id,
                            label: f.nome
                          }))
                        ]}
                        value={fornecedorId || ""}
                        onValueChange={(value) => {
                          if (value === 'novo') {
                            setModalFornecedor(true);
                          } else {
                            setFornecedorId(value);
                            const fornecedorSelecionado = fornecedores.find(f => f.id === value);
                            setFornecedor(fornecedorSelecionado ? fornecedorSelecionado.nome : "");
                          }
                        }}
                        placeholder="Busque e selecione o fornecedor..."
                        searchPlaceholder="Buscar fornecedor..."
                        emptyText="Nenhum fornecedor encontrado. Selecione 'Novo Fornecedor'."
                        className="w-full"
                      />
                      
                      {fornecedorId && (
                        <p className="text-xs text-green-600">
                          ✓ Fornecedor selecionado: {fornecedor}
                        </p>
                      )}
                    </div>

                    {/* Produto */}
                    <div className="space-y-2">
                      <Label htmlFor="produto">Produto *</Label>
                      <Combobox
                        options={produtoOptions}
                        value={produtoId}
                        onValueChange={handleProdutoChange}
                        placeholder="Busque e selecione o produto..."
                        searchPlaceholder="Buscar produto..."
                        emptyText="Nenhum produto encontrado."
                      />
                    </div>
                  </div>

                  {/* Segunda linha: Unidade, Quantidade, Valor Unitário, Média por Caixa e Data */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Unidade */}
                    <div className="space-y-2">
                      <Label htmlFor="unidade">Unidade *</Label>
                      <Select value={unidade} onValueChange={setUnidade}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bandeja">Bandeja</SelectItem>
                          <SelectItem value="Caixa">Caixa</SelectItem>
                          <SelectItem value="Gaiola">Gaiola</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Maço">Maço</SelectItem>
                          <SelectItem value="Pacote">Pacote</SelectItem>
                          <SelectItem value="Saco">Saco</SelectItem>
                          <SelectItem value="Unidade">Unidade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantidade */}
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade *</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        step="0.01"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    {/* Valor Unitário */}
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor Unit. (R$) *</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={valorUnitario}
                        onChange={(e) => setValorUnitario(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>

                    {/* Média por Caixa - só aparece quando unidade for Caixa */}
                    {unidade === 'Caixa' && (
                      <div className="space-y-2">
                        <Label htmlFor="media">Média por Caixa (kg)</Label>
                        <Input
                          id="media"
                          type="number"
                          step="0.01"
                          value={mediaPorCaixa}
                          onChange={(e) => {
                            setMediaPorCaixa(e.target.value);
                            // Atualizar no banco em tempo real
                            if (e.target.value && produtoId) {
                              atualizarMediaPorCaixa(e.target.value);
                            }
                          }}
                          placeholder="0,00"
                        />
                        <p className="text-xs text-gray-500">Atualiza automaticamente o cadastro do produto</p>
                      </div>
                    )}

                    {/* Data Prevista */}
                    <div className="space-y-2">
                      <Label>Data Prevista *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dataPrevista && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dataPrevista ? (
                              format(dataPrevista, "dd/MM", { locale: ptBR })
                            ) : (
                              <span>Data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dataPrevista}
                            onSelect={(date) => date && setDataPrevista(date)}
                            initialFocus
                            className="pointer-events-auto"
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-gray-500">Data prevista para recebimento</p>
                    </div>
                  </div>

                  {/* Valor Total Estimado */}
                  {valorTotal > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-blue-900">Valor Total Estimado</h3>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {parseFloat(valorUnitario) <= 14.99 && unidade === 'Caixa' && mediaPorCaixa ? 
                          `Cálculo: R$ ${valorUnitario} × ${mediaPorCaixa} kg × ${quantidade} = R$ ${valorTotal.toFixed(2)}` : 
                          `Cálculo: R$ ${valorUnitario} × ${quantidade} = R$ ${valorTotal.toFixed(2)}`
                        }
                      </p>
                    </div>
                  )}

                  {/* Terceira linha: Observações e Botão de Registro lado a lado */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Observações adicionais sobre o pedido..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-[68px]"
                      >
                        {loading ? "Registrando..." : "Registrar Pedido"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Histórico de Pedidos Simples</span>
                </CardTitle>
                <CardDescription>
                  Visualize seus pedidos anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtros Melhorados */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  {/* Filtro por Comprador */}
                  <Select 
                    value={filtrosHistorico.comprador} 
                    onValueChange={(value) => {
                      const novosFiltros = {...filtrosHistorico, comprador: value as 'todos' | 'meus' | string};
                      setFiltrosHistorico(novosFiltros);
                      buscarPedidos(novosFiltros);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar comprador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meus">Somente meus pedidos</SelectItem>
                      <SelectItem value="todos">Todos os compradores</SelectItem>
                      {compradores.map((comprador) => (
                        <SelectItem key={comprador.id} value={comprador.id}>
                          {comprador.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro por Fornecedor */}
                  <Select 
                    value={filtrosHistorico.fornecedor} 
                    onValueChange={(value) => {
                      const novosFiltros = {...filtrosHistorico, fornecedor: value};
                      setFiltrosHistorico(novosFiltros);
                      buscarPedidos(novosFiltros);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os fornecedores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os fornecedores</SelectItem>
                      {fornecedoresUnicos.map((fornecedor) => (
                        <SelectItem key={fornecedor} value={fornecedor}>
                          {fornecedor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro por Produto */}
                  <Input
                    placeholder="Filtrar por produto..."
                    value={filtrosHistorico.produto}
                    onChange={(e) => {
                      const novosFiltros = {...filtrosHistorico, produto: e.target.value};
                      setFiltrosHistorico(novosFiltros);
                      buscarPedidos(novosFiltros);
                    }}
                  />

                  {/* Data Início */}
                  <Input
                    type="date"
                    placeholder="Data início"
                    value={filtrosHistorico.dataInicio}
                    onChange={(e) => {
                      const novosFiltros = {...filtrosHistorico, dataInicio: e.target.value};
                      setFiltrosHistorico(novosFiltros);
                      buscarPedidos(novosFiltros);
                    }}
                  />

                  {/* Data Fim */}
                  <Input
                    type="date"
                    placeholder="Data fim"
                    value={filtrosHistorico.dataFim}
                    onChange={(e) => {
                      const novosFiltros = {...filtrosHistorico, dataFim: e.target.value};
                      setFiltrosHistorico(novosFiltros);
                      buscarPedidos(novosFiltros);
                    }}
                  />
                </div>

                {/* Lista do histórico agrupada por fornecedor */}
                {loadingCompradores ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando histórico...</p>
                  </div>
                ) : historicoCompleto.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum pedido encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(historicoPorFornecedor).map(([nomeFornecedor, pedidosFornecedor]) => (
                      <Card key={nomeFornecedor} className="bg-white">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2 text-lg">
                              <User className="h-5 w-5 text-blue-600" />
                              <span>{nomeFornecedor}</span>
                            </CardTitle>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Total do Fornecedor</p>
                                <p className="text-lg font-bold text-blue-600">
                                  R$ {calcularTotalFornecedor(pedidosFornecedor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja excluir TODOS os pedidos do fornecedor "${nomeFornecedor}"?`)) {
                                    excluirPedidosFornecedor(nomeFornecedor);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir Fornecedor
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {pedidosFornecedor.map((pedido) => {
                              const statusConfig = getStatusConfig(pedido.status_entrega || 'pendente');
                              
                              return (
                              <div key={pedido.id} className="border rounded-lg p-3 bg-gray-50">
                                 <div className="flex items-start justify-between mb-3">
                                   <div className="grid grid-cols-1 md:grid-cols-6 gap-3 flex-1">
                                     <div>
                                       <p className="text-xs text-gray-500">📅 Data Pedido</p>
                                       <p className="text-sm font-medium">
                                         {format(new Date(pedido.data_pedido), 'dd/MM/yyyy')}
                                       </p>
                                       {pedido.data_prevista && (
                                         <>
                                           <p className="text-xs text-gray-500 mt-1">📆 Data Prevista</p>
                                           <p className="text-sm font-medium">
                                             {format(new Date(pedido.data_prevista), 'dd/MM/yyyy')}
                                           </p>
                                         </>
                                       )}
                                     </div>
                                     <div>
                                       <p className="text-xs text-gray-500">Produto</p>
                                       <p className="text-sm font-medium">{pedido.produto_nome}</p>
                                       {pedido.tipo && (
                                         <p className="text-xs text-gray-600">({pedido.tipo})</p>
                                       )}
                                     </div>
                                     <div>
                                       <p className="text-xs text-gray-500">Quantidade</p>
                                       <p className="text-sm font-medium">{pedido.quantidade} {pedido.unidade}</p>
                                     </div>
                                     <div>
                                       <p className="text-xs text-gray-500">Valor Unit.</p>
                                       <p className="text-sm font-medium">
                                         R$ {pedido.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-xs text-gray-500">Total Est.</p>
                                       <p className="text-sm font-bold text-blue-600">
                                         R$ {pedido.valor_total_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-xs text-gray-500">Status</p>
                                       <Badge className={`${statusConfig.className} text-xs`}>
                                         <span className="mr-1">{statusConfig.icon}</span>
                                         {statusConfig.label}
                                       </Badge>
                                       {pedido.data_recebimento && (
                                         <p className="text-xs text-gray-500 mt-1">
                                           Recebido: {format(new Date(pedido.data_recebimento), 'dd/MM/yyyy')}
                                         </p>
                                       )}
                                     </div>
                                   </div>
                                   <div className="flex gap-2 ml-3">
                                     {!pedido.data_recebimento && (
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => marcarComoRecebido(pedido.id)}
                                         className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                       >
                                         <CheckCircle2 className="h-4 w-4 mr-1" />
                                         Recebido
                                       </Button>
                                     )}
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => {
                                         if (confirm('Tem certeza que deseja excluir este pedido?')) {
                                           excluirPedido(pedido.id);
                                         }
                                       }}
                                       className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                     >
                                       <Trash2 className="h-4 w-4" />
                                     </Button>
                                   </div>
                                 </div>
                                {pedido.observacoes && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">Observações:</p>
                                    <p className="text-xs text-gray-700">{pedido.observacoes}</p>
                                  </div>
                                )}
                               </div>
                             );
                             })}
                           </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal Novo Fornecedor */}
      <NovoFornecedorModal
        isOpen={modalFornecedor}
        onClose={() => setModalFornecedor(false)}
        onFornecedorCriado={handleNovoFornecedor}
      />
    </div>
  );
};

export default PedidoSimples;