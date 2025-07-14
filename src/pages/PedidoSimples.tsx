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
  Trash2
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
  criado_em: string;
  observacoes?: string;
}

const PedidoSimples = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fornecedores } = useFornecedores('pedido_simples');
  const { produtos } = useProdutosComPai();
  
  // Estado do formulário
  const [fornecedor, setFornecedor] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [produtoId, setProdutoId] = useState("");
  const [unidade, setUnidade] = useState("Caixa");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [dataPedido, setDataPedido] = useState<Date>(new Date());
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estado do histórico
  const [historico, setHistorico] = useState<PedidoSimples[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [filtros, setFiltros] = useState({
    fornecedor: "todos",
    produto: "",
    dataInicio: "",
    dataFim: ""
  });

  // Calcular valor total estimado
  const calcularTotal = () => {
    const qtd = parseFloat(quantidade) || 0;
    const valor = parseFloat(valorUnitario) || 0;
    const produtoSelecionado = produtos.find(p => p.id === produtoId);
    
    if (qtd === 0 || valor === 0) return 0;
    
    // Se valor <= 14,99 E unidade for "Caixa", multiplicar por média_kg_caixa
    if (valor <= 14.99 && produtoSelecionado?.media_por_caixa && unidade === 'Caixa') {
      return valor * produtoSelecionado.media_por_caixa * qtd;
    } else {
      return valor * qtd;
    }
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
      
      // Se fornecedor não existe, criar automaticamente
      if (!fornecedorId && fornecedor) {
        const { data: novoFornecedor, error: errorFornecedor } = await supabase
          .from('fornecedores')
          .insert({
            nome: fornecedor,
            status_tipo: 'Pedido Simples'
          })
          .select()
          .single();

        if (errorFornecedor) throw errorFornecedor;
        fornecedorFinalId = novoFornecedor.id;
        
        toast.success(`Fornecedor "${fornecedor}" cadastrado automaticamente`);
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
          data_pedido: format(dataPedido, 'yyyy-MM-dd'),
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
      setDataPedido(new Date());
      
      // Atualizar histórico se estiver na aba histórico
      if (loadingHistorico) {
        carregarHistorico();
      }
      
    } catch (error: any) {
      console.error('Erro ao registrar pedido:', error);
      toast.error(error.message || "Erro ao registrar pedido");
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      let query = supabase
        .from('pedidos_simples')
        .select('*')
        .eq('user_id', user?.id)
        .order('criado_em', { ascending: false });

      // Aplicar filtros
      if (filtros.fornecedor && filtros.fornecedor !== "todos") {
        query = query.eq('fornecedor_nome', filtros.fornecedor);
      }
      if (filtros.produto) {
        query = query.ilike('produto_nome', `%${filtros.produto}%`);
      }
      if (filtros.dataInicio) {
        query = query.gte('data_pedido', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        query = query.lte('data_pedido', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistorico(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoadingHistorico(false);
    }
  };

  const selecionarFornecedor = (fornecedorSelecionado: any) => {
    setFornecedor(fornecedorSelecionado.nome);
    setFornecedorId(fornecedorSelecionado.id);
  };

  // Agrupar histórico por fornecedor
  const historicoPorFornecedor = historico.reduce((acc, pedido) => {
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
    new Set(historico.map(p => p.fornecedor_nome))
  ).sort();

  // Função para excluir pedido individual
  const excluirPedido = async (pedidoId: string) => {
    try {
      console.log('Tentando excluir pedido:', pedidoId, 'para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('pedidos_simples')
        .delete()
        .eq('id', pedidoId)
        .eq('user_id', user?.id)
        .select();

      console.log('Resultado da exclusão:', { data, error });

      if (error) {
        console.error('Erro na exclusão:', error);
        throw error;
      }

      if (data && data.length === 0) {
        toast.error("Pedido não encontrado ou você não tem permissão para excluí-lo");
        return;
      }

      toast.success("Pedido excluído com sucesso!");
      carregarHistorico();
    } catch (error: any) {
      console.error('Erro ao excluir pedido:', error);
      toast.error(error.message || 'Erro ao excluir pedido');
    }
  };

  // Função para excluir todos os pedidos de um fornecedor
  const excluirPedidosFornecedor = async (nomeFornecedor: string) => {
    try {
      console.log('Tentando excluir pedidos do fornecedor:', nomeFornecedor, 'para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('pedidos_simples')
        .delete()
        .eq('fornecedor_nome', nomeFornecedor)
        .eq('user_id', user?.id)
        .select();

      console.log('Resultado da exclusão do fornecedor:', { data, error });

      if (error) {
        console.error('Erro na exclusão do fornecedor:', error);
        throw error;
      }

      if (data && data.length === 0) {
        toast.error("Nenhum pedido encontrado para este fornecedor ou você não tem permissão");
        return;
      }

      toast.success(`${data?.length || 0} pedidos do fornecedor "${nomeFornecedor}" foram excluídos!`);
      carregarHistorico();
    } catch (error: any) {
      console.error('Erro ao excluir pedidos do fornecedor:', error);
      toast.error(error.message || 'Erro ao excluir pedidos do fornecedor');
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
                    {/* Fornecedor */}
                    <div className="space-y-2">
                      <Label htmlFor="fornecedor">Fornecedor *</Label>
                      <div className="relative">
                        <Input
                          id="fornecedor"
                          value={fornecedor}
                          onChange={(e) => {
                            setFornecedor(e.target.value);
                            setFornecedorId(null);
                          }}
                          placeholder="Digite o nome do fornecedor..."
                          className="pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Sugestões de fornecedores */}
                      {fornecedor && !fornecedorId && fornecedoresFiltrados.length > 0 && (
                        <div className="border rounded-md bg-white shadow-sm max-h-40 overflow-y-auto">
                          {fornecedoresFiltrados.slice(0, 5).map((f) => (
                            <div
                              key={f.id}
                              onClick={() => selecionarFornecedor(f)}
                              className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{f.nome}</span>
                                <Badge variant="outline" className="text-xs">
                                  {f.status_tipo || 'Cotação e Pedido'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {fornecedor && !fornecedorId && fornecedoresFiltrados.length === 0 && (
                        <p className="text-xs text-blue-600">
                          Fornecedor será cadastrado automaticamente
                        </p>
                      )}
                    </div>

                    {/* Produto */}
                    <div className="space-y-2">
                      <Label htmlFor="produto">Produto *</Label>
                      <Combobox
                        options={produtoOptions}
                        value={produtoId}
                        onValueChange={setProdutoId}
                        placeholder="Busque e selecione o produto..."
                        searchPlaceholder="Buscar produto..."
                        emptyText="Nenhum produto encontrado."
                      />
                    </div>
                  </div>

                  {/* Segunda linha: Unidade, Quantidade, Valor Unitário e Data */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                    {/* Data do Pedido */}
                    <div className="space-y-2">
                      <Label>Data do Pedido *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dataPedido && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dataPedido ? (
                              format(dataPedido, "dd/MM", { locale: ptBR })
                            ) : (
                              <span>Data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dataPedido}
                            onSelect={(date) => date && setDataPedido(date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
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
                        {parseFloat(valorUnitario) <= 14.99 && unidade === 'Caixa' ? 
                          'Cálculo: Valor × Média por Caixa × Quantidade' : 
                          'Cálculo: Valor × Quantidade'
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
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Select 
                    value={filtros.fornecedor} 
                    onValueChange={(value) => setFiltros({...filtros, fornecedor: value})}
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
                  <Input
                    placeholder="Filtrar por produto..."
                    value={filtros.produto}
                    onChange={(e) => setFiltros({...filtros, produto: e.target.value})}
                  />
                  <Input
                    type="date"
                    placeholder="Data início"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                  />
                  <Input
                    type="date"
                    placeholder="Data fim"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                  />
                </div>

                <Button onClick={carregarHistorico} className="mb-4">
                  Buscar
                </Button>

                {/* Lista do histórico agrupada por fornecedor */}
                {loadingHistorico ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando histórico...</p>
                  </div>
                ) : historico.length === 0 ? (
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
                            {pedidosFornecedor.map((pedido) => (
                              <div key={pedido.id} className="border rounded-lg p-3 bg-gray-50">
                                 <div className="flex items-start justify-between mb-3">
                                   <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                                     <div>
                                       <p className="text-xs text-gray-500">Data</p>
                                       <p className="text-sm font-medium">
                                         {format(new Date(pedido.data_pedido), 'dd/MM/yyyy')}
                                       </p>
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
                                   </div>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => {
                                       if (confirm('Tem certeza que deseja excluir este pedido?')) {
                                         excluirPedido(pedido.id);
                                       }
                                     }}
                                     className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-3"
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </div>
                                {pedido.observacoes && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">Observações:</p>
                                    <p className="text-xs text-gray-700">{pedido.observacoes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
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
    </div>
  );
};

export default PedidoSimples;