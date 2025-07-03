import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail } from "lucide-react";

const PendingApproval = () => {
  const { user, signOut } = useAuth();

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
            <div className="text-center space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Mail className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Conta Criada</span>
                </div>
                <p className="text-sm text-orange-700">
                  Olá <strong>{user?.nome}</strong>! Sua conta foi criada com sucesso.
                </p>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Seu acesso ao sistema está <strong>aguardando aprovação</strong> pelo administrador.
                </p>
                <p>
                  Você receberá uma notificação por email quando seu acesso for liberado.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Dúvidas?</strong> Entre em contato com o TI em dalpozzo.ti@gmail.com
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={signOut}
                variant="outline"
                className="w-full"
              >
                Fazer Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Super Dal Pozzo - Sistema FLV</p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;