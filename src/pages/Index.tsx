import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-6 bg-slate-500">
            <span className="text-white text-3xl font-bold">FLV</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verdura Super Fácil</h1>
          <p className="text-xl text-gray-600">Facilitando as rotinas da feira</p>
          
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-blue-600">Bem-vindo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">Gestão de estoque, requisições, cotações e recebimento de produtos FLV.</p>
              
              <Button onClick={() => navigate("/auth")} size="lg" className="w-full text-white font-semibold py-3 bg-blue-600 hover:bg-blue-500">
                Acessar Sistema
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-8 text-sm text-gray-600">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Funcionalidades:</h3>
                <ul className="space-y-1">
                  <li>• Controle de estoque por loja</li>
                  <li>• Requisições de compra</li>
                  <li>• Cotações com fornecedores</li>
                  <li>• Gestão de recebimentos</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Acesso:</h3>
                <ul className="space-y-1">
                  <li>• Login unificado com Google</li>
                  <li>• Acesso por convite via email</li>
                  <li>• Interface responsiva</li>
                  <li>• Segurança avançada</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 Verdura Super Fácil - Sistema FLV v2.0</p>
          <p>Desenvolvido com inteligência sem experiência</p>
          <div className="flex justify-center space-x-4 mt-2">
            <button onClick={() => navigate("/politica-privacidade")} className="text-gray-400 hover:text-gray-600 underline">
              Política de Privacidade
            </button>
            <span className="text-gray-300">•</span>
            <button onClick={() => navigate("/termos-uso")} className="text-gray-400 hover:text-gray-600 underline">
              Termos de Uso
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;