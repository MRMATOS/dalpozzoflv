import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Calendar, DollarSign, Users, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useHistoricoPedidosCompleto, type Filtros } from '@/hooks/useHistoricoPedidosCompleto';

const HistoricoPedidosCompleto = () => {
  const navigate = useNavigate();
  const {
    pedidosCotacao,
    pedidosSimples,
    compradores,
    loadingCotacao,
    loadingSimples,
    buscarPedidosCotacao,
    buscarPedidosSimples,
    isComprador,
    isMaster
  } = useHistoricoPedidosCompleto();

  const [filtros, setFiltros] = useState<Filtros>({
    usuario: 'meus',
    fornecedor: '',
    produto: '',
    dataInicio: '',
    dataFim: ''
  });

  const handleBuscarCotacao = () => {
    buscarPedidosCotacao(filtros);
  };

  const handleBuscarSimples = () => {
    buscarPedidosSimples(filtros);
  };

  const resetFiltros = () => {
    setFiltros({
      usuario: 'meus',
      fornecedor: '',
      produto: '',
      dataInicio: '',
      dataFim: ''
    });
  };

  const FiltrosSection = ({ onBuscar }: { onBuscar: () => void }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros de Busca
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Filtro de Usuário - apenas para compradores */}
          {(isComprador || isMaster) && (
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select 
                value={filtros.usuario} 
                onValueChange={(value) => setFiltros({...filtros, usuario: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meus">Meus pedidos</SelectItem>
                  <SelectItem value="todos">Todos os pedidos</SelectItem>
                  {compradores.map((comprador) => (
                    <SelectItem key={comprador.id} value={comprador.id}>
                      {comprador.nome} ({comprador.loja})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Filtro de Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Input
              placeholder="Nome do fornecedor..."
              value={filtros.fornecedor}
              onChange={(e) => setFiltros({...filtros, fornecedor: e.target.value})}
            />
          </div>

          {/* Filtro de Produto */}
          <div className="space-y-2">
            <Label>Produto</Label>
            <Input
              placeholder="Nome do produto..."
              value={filtros.produto}
              onChange={(e) => setFiltros({...filtros, produto: e.target.value})}
            />
          </div>

          {/* Data Início */}
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
            />
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onBuscar} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <Button variant="outline" onClick={resetFiltros}>
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PedidoCotacaoCard = ({ pedido }: { pedido: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{pedido.fornecedor_nome}</h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {pedido.quantidade_itens} itens
              </Badge>
              {(isComprador || isMaster) && filtros.usuario !== 'meus' && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {pedido.usuario_nome}
                  </Badge>
                  {pedido.usuario_loja && (
                    <Badge variant="outline" className="text-xs">
                      {pedido.usuario_loja}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(pedido.criado_em), 'dd/MM/yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                R$ {pedido.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PedidoSimplesCard = ({ pedido }: { pedido: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{pedido.fornecedor_nome}</h3>
              <Badge variant="outline">{pedido.produto_nome}</Badge>
              {(isComprador || isMaster) && filtros.usuario !== 'meus' && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {pedido.usuario_nome}
                  </Badge>
                  {pedido.usuario_loja && (
                    <Badge variant="outline" className="text-xs">
                      {pedido.usuario_loja}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
              <div>
                <span className="font-medium">Qtd:</span> {pedido.quantidade} {pedido.unidade}
              </div>
              <div>
                <span className="font-medium">Unit:</span> R$ {pedido.valor_unitario.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Total:</span> R$ {pedido.valor_total_estimado.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Data:</span> {format(new Date(pedido.data_pedido), 'dd/MM/yyyy')}
              </div>
            </div>
            {pedido.observacoes && (
              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                <strong>Obs:</strong> {pedido.observacoes}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Histórico Completo de Pedidos</h1>
                <p className="text-sm text-gray-500">Visualize pedidos de cotação e pedidos simples</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="cotacao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cotacao" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Pedidos de Cotação</span>
            </TabsTrigger>
            <TabsTrigger value="simples" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Pedidos Simples</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cotacao" className="space-y-6">
            <FiltrosSection onBuscar={handleBuscarCotacao} />
            
            {loadingCotacao ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando pedidos de cotação...</p>
              </div>
            ) : pedidosCotacao.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido de cotação encontrado</h2>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros ou fazer uma nova busca.
                  </p>
                  <Button onClick={() => navigate('/cotacao')}>
                    Fazer Nova Cotação
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Encontrados {pedidosCotacao.length} pedidos de cotação
                  </p>
                </div>
                {pedidosCotacao.map((pedido) => (
                  <PedidoCotacaoCard key={pedido.id} pedido={pedido} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="simples" className="space-y-6">
            <FiltrosSection onBuscar={handleBuscarSimples} />
            
            {loadingSimples ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando pedidos simples...</p>
              </div>
            ) : pedidosSimples.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido simples encontrado</h2>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros ou fazer uma nova busca.
                  </p>
                  <Button onClick={() => navigate('/pedido-simples')}>
                    Fazer Novo Pedido Simples
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Encontrados {pedidosSimples.length} pedidos simples
                  </p>
                </div>
                {pedidosSimples.map((pedido) => (
                  <PedidoSimplesCard key={pedido.id} pedido={pedido} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HistoricoPedidosCompleto;