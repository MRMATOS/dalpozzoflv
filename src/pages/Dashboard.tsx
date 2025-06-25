import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart, Package, Calculator, History, Settings, BarChart3, Users, Store, LogOut, Building2 } from "lucide-react";
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    profile,
    hasRole,
    signOut
  } = useAuth();
  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };
  const cards = [
  // Gestão CD - disponível para usuários 'cd' ou 'master'
  (hasRole('cd') || hasRole('master')) && {
    title: "Gestão CD",
    description: "Gerenciar requisições e transferências",
    icon: Building2,
    color: "bg-cyan-500",
    onClick: () => navigate("/gestao-cd")
  },
  // Estoque - disponível para usuários 'estoque' ou 'master'
  (hasRole('estoque') || hasRole('master')) && {
    title: "Estoque",
    description: "Gerenciar estoque de produtos",
    icon: Package,
    color: "bg-blue-500",
    onClick: () => navigate("/estoque")
  },
  // Requisições - disponível para usuários 'requisitante' ou 'master'
  (hasRole('requisitante') || hasRole('master')) && {
    title: "Requisições",
    description: "Criar e gerenciar requisições",
    icon: ShoppingCart,
    color: "bg-green-500",
    onClick: () => navigate("/requisicoes")
  },
  // Cotação - disponível para usuários 'comprador' ou 'master'
  (hasRole('comprador') || hasRole('master')) && {
    title: "Cotação",
    description: "Comparar preços e criar pedidos",
    icon: Calculator,
    color: "bg-purple-500",
    onClick: () => navigate("/cotacao")
  },
  // Histórico de Requisições - disponível para usuários 'comprador', 'requisitante' ou 'master'
  (hasRole('comprador') || hasRole('requisitante') || hasRole('master')) && {
    title: "Histórico de Requisições",
    description: "Visualizar requisições anteriores",
    icon: History,
    color: "bg-orange-500",
    onClick: () => navigate("/historico-requisicoes")
  },
  // Histórico de Pedidos - disponível para usuários 'comprador' ou 'master'
  (hasRole('comprador') || hasRole('master')) && {
    title: "Histórico de Pedidos",
    description: "Visualizar pedidos de compra",
    icon: BarChart3,
    color: "bg-indigo-500",
    onClick: () => navigate("/historico-pedidos")
  },
  // Configurações - disponível para usuários 'comprador' ou 'master'
  (hasRole('comprador') || hasRole('master')) && {
    title: "Configurações",
    description: "Gerenciar produtos e fornecedores",
    icon: Settings,
    color: "bg-gray-500",
    onClick: () => navigate("/configuracoes")
  }].filter(Boolean);
  return <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">FLV</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {profile?.loja}
                  </Badge>
                  {hasRole('master') && <Badge variant="default" className="text-xs bg-red-600">
                      Master
                    </Badge>}
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Sistema de compras FLV Super Dal Pozzo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: any, index) => {
          const IconComponent = card.icon;
          return <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-sm">
                    {card.description}
                  </CardDescription>
                  <Button onClick={card.onClick} className="w-full" variant="outline">
                    Acessar
                  </Button>
                </CardContent>
              </Card>;
        })}
        </div>

        {cards.length === 0 && <Card className="text-center py-8">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhuma funcionalidade disponível para seu perfil.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Entre em contato com o administrador para verificar suas permissões.
              </p>
            </CardContent>
          </Card>}
      </main>
    </div>;
};
export default Dashboard;