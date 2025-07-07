import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PendingApproval = () => {
  const { user, signOut, loading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Verificar status de aprovação periodicamente
  useEffect(() => {
    if (!user?.id) return;

    const checkApprovalStatus = async () => {
      try {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('aprovado')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.aprovado) {
          console.log('Usuário foi aprovado! Redirecionando...');
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    // Verificar imediatamente
    checkApprovalStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkApprovalStatus, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  // Se usuário não está pendente, redirecionar
  useEffect(() => {
    if (!loading && user && !(user as any).pendingApproval) {
      window.location.href = '/dashboard';
    }
  }, [user, loading]);

  const handleCheckStatus = async () => {
    if (!user?.id) return;
    
    setCheckingStatus(true);
    try {
      const { data: profile } = await supabase
        .from('usuarios')
        .select('aprovado')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.aprovado) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Clock className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Aguardando Aprovação</h1>
          <p className="text-gray-600 text-sm">Sistema FLV - Super Dal Pozzo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">Acesso Pendente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Aguardando Aprovação</span>
                </div>
                <p className="text-sm text-orange-700">
                  Olá <strong>{user?.nome}</strong>! Sua conta foi criada com sucesso, mas ainda precisa ser aprovada por um administrador.
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Conta criada com sucesso</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>Aguardando aprovação do administrador</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  <span>Acesso ao sistema liberado</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">Próximos passos:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Aguarde a aprovação do administrador</li>
                  <li>• Você receberá acesso em breve</li>
                  <li>• Em caso de dúvidas, entre em contato com o TI</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {checkingStatus ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Status
                  </>
                )}
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                className="w-full"
              >
                Sair da Conta
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Super Dal Pozzo - Sistema FLV</p>
          <p>Para suporte, entre em contato com dalpozzo.ti@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;