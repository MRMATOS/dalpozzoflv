
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ShoppingCart, 
  Package, 
  Calculator, 
  History, 
  Settings,
  Truck,
  BarChart3,
  Users,
  Store
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, hasRole } = useAuth();

  const cards = [
    // Estoque
    hasRole('estoque') && {
      title: "Estoque",
      description: "Gerenciar estoque de produtos",
      icon: Package,
      color: "bg-blue-500",
      onClick: () => navigate("/estoque")
    },
    
    // Requisições
    hasRole('requisitante') && {
      title: "Requisições",
      description: "Criar e gerenciar requisições",
      icon: ShoppingCart,
      color: "bg-green-500",
      onClick: () => navigate("/requisicoes")
    },

    // Transferências
    (hasRole('transferencia') || hasRole('requisitante')) && {
      title: "Transferências",
      description: hasRole('transferencia') 
        ? "Gerenciar transferências entre lojas" 
        : "Confirmar recebimento de produtos",
      icon: Truck,
      color: "bg-yellow-500",
      onClick: () => navigate("/transferencias")
    },
    
    // Cotação
    hasRole('comprador') && {
      title: "Cotação",
      description: "Comparar preços e criar pedidos",
      icon: Calculator,
      color: "bg-purple-500",
      onClick: () => navigate("/cotacao")
    },
    
    // Histórico de Requisições
    (hasRole('comprador') || hasRole('requisitante')) && {
      title: "Histórico de Requisições",
      description: "Visualizar requisições anteriores",
      icon: History,
      color: "bg-orange-500",
      onClick: () => navigate("/historico-requisicoes")
    },
    
    // Histórico de Pedidos
    hasRole('comprador') && {
      title: "Histórico de Pedidos",
      description: "Visualizar pedidos de compra",
      icon: BarChart3,
      color: "bg-indigo-500",
      onClick: () => navigate("/historico-pedidos")
    },
    
    // Configurações
    hasRole('master') && {
      title: "Configurações",
      description: "Gerenciar sistema e usuários",
      icon: Settings,
      color: "bg-gray-500",
      onClick: () => navigate("/configuracoes")
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Supermercado Dalpozzo - FLV
                </h1>
                <p className="text-sm text-gray-500">Sistema de Compras</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {profile?.loja}
                  </Badge>
                  {hasRole('master') && (
                    <Badge variant="default" className="text-xs bg-red-600">
                      Master
                    </Badge>
                  )}
                  {hasRole('comprador') && (
                    <Badge variant="default" className="text-xs bg-purple-600">
                      Comprador
                    </Badge>
                  )}
                  {hasRole('estoque') && (
                    <Badge variant="default" className="text-xs bg-blue-600">
                      Estoque
                    </Badge>
                  )}
                  {hasRole('requisitante') && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      Requisitante
                    </Badge>
                  )}
                  {hasRole('transferencia') && (
                    <Badge variant="default" className="text-xs bg-yellow-600">
                      Transferência
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Bem-vindo ao sistema de compras FLV. Escolha uma das opções abaixo para começar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: any, index) => {
            const IconComponent = card.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                  <Button 
                    onClick={card.onClick} 
                    className="w-full"
                    variant="outline"
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {cards.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhuma funcionalidade disponível para seu perfil.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Entre em contato com o administrador para verificar suas permissões.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
