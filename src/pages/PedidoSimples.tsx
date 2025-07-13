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
  Calculator
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
  const { fornecedores } = useFornecedores();
  const { produtos } = useProdutosComPai();
  
  // Estado do formulário
  const [fornecedor, setFornecedor] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [produtoId, setProdutoId] = useState("");
  const [unidade, setUnidade] = useState("Caixa");
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [dataPedido, setDataPedido] = useState<Date>(new Date());
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estado do histórico
  const [historico, setHistorico] = useState<PedidoSimples[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [filtros, setFiltros] = useState({
    fornecedor: "",
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
    
    // Se valor <= 14,99, multiplicar por média_kg_caixa
    if (valor <= 14.99 && produtoSelecionado?.media_por_caixa) {
      return valor * produtoSelecionado.media_por_caixa * qtd;
    } else {
      return valor * qtd;
    }
  };

  const valorTotal = calcularTotal();

  // Busca inteligente de fornecedor
  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(fornecedor.toLowerCase()) &&
    (f.status_tipo === 'Pedido Simples' || f.status_tipo === 'Cotação e Pedido' || !f.status_tipo)
  );

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
          produto_nome: produtoSelecionado?.produto || '',
          unidade,
          tipo,
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
      
      // Limpar formulário
      setFornecedor("");
      setFornecedorId(null);
      setProdutoId("");
      setTipo("");
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
      if (filtros.fornecedor) {
        query = query.ilike('fornecedor_nome', `%${filtros.fornecedor}%`);
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
                      <Select value={produtoId} onValueChange={setProdutoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id!}>
                              {produto.produto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unidade */}
                    <div className="space-y-2">
                      <Label htmlFor="unidade">Unidade *</Label>
                      <Select value={unidade} onValueChange={setUnidade}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Caixa">Caixa</SelectItem>
                          <SelectItem value="Pacote">Pacote</SelectItem>
                          <SelectItem value="Unidade">Unidade</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo / Variação</Label>
                      <Input
                        id="tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        placeholder="Ex: Especial, Nacional..."
                      />
                    </div>

                    {/* Quantidade */}
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade de Caixas *</Label>
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
                      <Label htmlFor="valor">Valor Unitário (R$) *</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={valorUnitario}
                        onChange={(e) => setValorUnitario(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
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
                            format(dataPedido, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
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
                        {parseFloat(valorUnitario) <= 14.99 ? 
                          'Cálculo: Valor × Média por Caixa × Quantidade' : 
                          'Cálculo: Valor × Quantidade'
                        }
                      </p>
                    </div>
                  )}

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações adicionais sobre o pedido..."
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Registrando..." : "Registrar Pedido"}
                  </Button>
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
                  <Input
                    placeholder="Filtrar por fornecedor..."
                    value={filtros.fornecedor}
                    onChange={(e) => setFiltros({...filtros, fornecedor: e.target.value})}
                  />
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

                {/* Lista do histórico */}
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
                  <div className="space-y-4">
                    {historico.map((pedido) => (
                      <div key={pedido.id} className="border rounded-lg p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Data</p>
                            <p className="font-medium">
                              {format(new Date(pedido.data_pedido), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Fornecedor</p>
                            <p className="font-medium">{pedido.fornecedor_nome}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Produto</p>
                            <p className="font-medium">{pedido.produto_nome}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Quantidade</p>
                            <p className="font-medium">{pedido.quantidade} {pedido.unidade}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Valor Unit.</p>
                            <p className="font-medium">
                              R$ {pedido.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Est.</p>
                            <p className="font-bold text-blue-600">
                              R$ {pedido.valor_total_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        {pedido.observacoes && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-gray-500">Observações:</p>
                            <p className="text-sm">{pedido.observacoes}</p>
                          </div>
                        )}
                      </div>
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