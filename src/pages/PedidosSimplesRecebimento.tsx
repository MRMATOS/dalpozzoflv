import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Search, Clock, CheckCircle, Calendar, Filter, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePedidosSimples } from "@/hooks/usePedidosSimples";
import { format, addDays, isToday, isTomorrow, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const PedidosSimplesRecebimento = () => {
  const navigate = useNavigate();
  const { pedidos, loading, buscarPedidos, marcarComoRecebido, getStatusConfig } = usePedidosSimples();
  
  const [filtros, setFiltros] = useState({
    fornecedor: "",
    produto: "",
    status: "todos",
    dataPrevista: "todos"
  });

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = () => {
    buscarPedidos(filtros);
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (filtros.fornecedor && !pedido.fornecedor_nome.toLowerCase().includes(filtros.fornecedor.toLowerCase())) {
      return false;
    }
    if (filtros.produto && !pedido.produto_nome.toLowerCase().includes(filtros.produto.toLowerCase())) {
      return false;
    }
    if (filtros.status !== "todos" && pedido.status_entrega !== filtros.status) {
      return false;
    }
    
    // Filtro por data prevista
    if (filtros.dataPrevista !== "todos" && pedido.data_prevista) {
      const dataPrevista = new Date(pedido.data_prevista);
      const hoje = new Date();
      
      switch (filtros.dataPrevista) {
        case "hoje":
          if (!isToday(dataPrevista)) return false;
          break;
        case "amanha":
          if (!isTomorrow(dataPrevista)) return false;
          break;
        case "atrasados":
          if (!isBefore(dataPrevista, hoje) || pedido.data_recebimento) return false;
          break;
        case "proximos7dias":
          const proximosSeteDias = addDays(hoje, 7);
          if (isBefore(dataPrevista, hoje) || isAfter(dataPrevista, proximosSeteDias)) return false;
          break;
      }
    }
    
    return true;
  });

  const fornecedoresUnicos = Array.from(
    new Set(pedidos.map(p => p.fornecedor_nome))
  ).sort();

  // Estatísticas dos pedidos
  const estatisticas = {
    total: pedidos.length,
    pendentes: pedidos.filter(p => !p.data_recebimento).length,
    recebidos: pedidos.filter(p => p.data_recebimento).length,
    hoje: pedidos.filter(p => p.data_prevista && isToday(new Date(p.data_prevista))).length,
    atrasados: pedidos.filter(p => p.data_prevista && isBefore(new Date(p.data_prevista), new Date()) && !p.data_recebimento).length
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
              <h1 className="text-xl font-semibold text-gray-900">Pedidos para Recebimento</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Pedidos para Recebimento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
                  <p className="text-sm text-gray-500">Pendentes</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{estatisticas.recebidos}</p>
                  <p className="text-sm text-gray-500">Recebidos</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{estatisticas.hoje}</p>
                  <p className="text-sm text-gray-500">Hoje</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{estatisticas.atrasados}</p>
                  <p className="text-sm text-gray-500">Atrasados</p>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="filtros" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filtros">Filtros Avançados</TabsTrigger>
                <TabsTrigger value="acesso-rapido">Acesso Rápido</TabsTrigger>
              </TabsList>

              <TabsContent value="filtros">
                {/* Filtros Avançados */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                  <Select value={filtros.status} onValueChange={(value) => setFiltros({...filtros, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pendente">⏳ Pendente</SelectItem>
                      <SelectItem value="pontual">✅ Pontual</SelectItem>
                      <SelectItem value="atrasado">⚠️ Atrasado</SelectItem>
                      <SelectItem value="adiantado">⏱️ Adiantado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtros.dataPrevista} onValueChange={(value) => setFiltros({...filtros, dataPrevista: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Data Prevista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as datas</SelectItem>
                      <SelectItem value="hoje">📅 Chega hoje</SelectItem>
                      <SelectItem value="amanha">📆 Chega amanhã</SelectItem>
                      <SelectItem value="proximos7dias">📊 Próximos 7 dias</SelectItem>
                      <SelectItem value="atrasados">⚠️ Atrasados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={carregarPedidos} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="acesso-rapido">
                {/* Botões de Acesso Rápido */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setFiltros({...filtros, dataPrevista: "hoje", status: "pendente"})}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <span className="text-lg">📅</span>
                    <span className="text-sm">Chega Hoje</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setFiltros({...filtros, dataPrevista: "amanha", status: "pendente"})}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <span className="text-lg">📆</span>
                    <span className="text-sm">Chega Amanhã</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setFiltros({...filtros, dataPrevista: "atrasados", status: "pendente"})}
                    className="h-16 flex flex-col items-center justify-center text-red-600 border-red-200"
                  >
                    <span className="text-lg">⚠️</span>
                    <span className="text-sm">Atrasados</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setFiltros({...filtros, status: "todos", dataPrevista: "todos"})}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <span className="text-lg">📊</span>
                    <span className="text-sm">Ver Todos</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Lista de pedidos */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando pedidos...</p>
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidosFiltrados.map((pedido) => {
                  const statusConfig = getStatusConfig(pedido.status_entrega || 'pendente');
                  
                  return (
                    <Card key={pedido.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
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
                            <p className="text-sm text-gray-500">📅 Data Pedido</p>
                            <p className="font-medium">
                              {format(new Date(pedido.data_pedido), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            {pedido.data_prevista && (
                              <>
                                <p className="text-sm text-gray-500 mt-1">📆 Data Prevista</p>
                                <p className="font-medium">
                                  {format(new Date(pedido.data_prevista), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              </>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Valor Total</p>
                            <p className="font-bold text-blue-600">
                              R$ {pedido.valor_total_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge className={`${statusConfig.className} justify-center`}>
                              <span className="mr-1">{statusConfig.icon}</span>
                              {statusConfig.label}
                            </Badge>
                            {pedido.data_recebimento && (
                              <p className="text-xs text-gray-500 mt-1">
                                Recebido: {format(new Date(pedido.data_recebimento), 'dd/MM/yyyy')}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2">
                            {!pedido.data_recebimento ? (
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => marcarComoRecebido && marcarComoRecebido(pedido.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marcar Recebido
                              </Button>
                            ) : (
                              <Badge variant="outline" className="justify-center text-green-600 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Recebido
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PedidosSimplesRecebimento;