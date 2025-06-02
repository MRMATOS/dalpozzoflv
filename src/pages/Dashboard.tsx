
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  ClipboardList, 
  Package, 
  Users, 
  BarChart3, 
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
  Settings,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { profile, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const getDashboardContent = () => {
    if (hasRole('comprador')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requisições Pendentes</CardTitle>
              <ClipboardList className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">12</div>
              <p className="text-xs text-muted-foreground">+3 desde ontem</p>
              <Button 
                size="sm" 
                className="mt-3 bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate('/requisicoes')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Todas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nova Cotação</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Criar</div>
              <p className="text-xs text-muted-foreground">Comparar preços dos fornecedores</p>
              <Button 
                size="sm" 
                className="mt-3 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/cotacao')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Cotação
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">8</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
              <Button 
                size="sm" 
                className="mt-3 bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/resumo-pedido')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (hasRole('requisitante')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nova Requisição</CardTitle>
              <Plus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Criar</div>
              <p className="text-xs text-muted-foreground">Fazer nova requisição de produtos</p>
              <Button 
                size="sm" 
                className="mt-3 bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/requisicoes')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Requisição
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minhas Requisições</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <p className="text-xs text-muted-foreground">3 pendentes, 2 atendidas</p>
              <Button 
                size="sm" 
                className="mt-3 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/requisicoes')}
              >
                <History className="w-4 h-4 mr-2" />
                Ver Histórico
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status da Loja</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">OK</div>
              <p className="text-xs text-muted-foreground">Estoque: {profile?.loja}</p>
              <Button 
                size="sm" 
                className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (hasRole('estoque')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">7</div>
              <p className="text-xs text-muted-foreground">Produtos com estoque baixo</p>
              <Button 
                size="sm" 
                className="mt-3 bg-red-600 hover:bg-red-700"
                onClick={() => navigate('/estoque')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Alertas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atualizar Estoque</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Ação</div>
              <p className="text-xs text-muted-foreground">Registrar entrada/saída</p>
              <Button 
                size="sm" 
                className="mt-3 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/estoque')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Críticos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-orange-600">Alface</div>
              <p className="text-xs text-muted-foreground">Precisa reposição urgente</p>
              <Button 
                size="sm" 
                className="mt-3 bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate('/estoque')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Todos
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (hasRole('master')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nova Cotação</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Criar</div>
              <p className="text-xs text-muted-foreground">Comparar preços dos fornecedores</p>
              <Button 
                size="sm" 
                className="mt-3 bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/cotacao')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Cotação
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requisições Hoje</CardTitle>
              <ClipboardList className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">18</div>
              <p className="text-xs text-muted-foreground">12 pendentes</p>
              <Button 
                size="sm" 
                className="mt-3 bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/requisicoes')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Todas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">24</div>
              <p className="text-xs text-muted-foreground">+2 este mês</p>
              <Button 
                size="sm" 
                className="mt-3 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/configuracoes')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema</CardTitle>
              <Settings className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">Config</div>
              <p className="text-xs text-muted-foreground">Produtos, usuários, fornecedores</p>
              <Button 
                size="sm" 
                className="mt-3 bg-gray-600 hover:bg-gray-700"
                onClick={() => navigate('/configuracoes')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipo de usuário não reconhecido</CardTitle>
          <CardDescription>
            Entre em contato com o administrador do sistema.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">FLV</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Sistema FLV</h1>
                <p className="text-sm text-gray-500">Super Dal Pozzo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.roles?.[0]} - {profile?.loja}</p>
              </div>
              <Button variant="outline" onClick={signOut} size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo, {profile?.nome}!
          </h2>
          <p className="text-gray-600">
            Aqui está um resumo das suas atividades {hasRole('master') ? 'do sistema' : `da ${profile?.loja}`}.
          </p>
        </div>

        {getDashboardContent()}
      </main>
    </div>
  );
};

export default Dashboard;
