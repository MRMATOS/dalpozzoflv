import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Chrome } from "lucide-react";
import { useState, useEffect } from "react";

const Auth = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('Usuário autenticado, redirecionando para dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      console.log('Iniciando login Google...');
      const result = await signInWithGoogle();
      
      if (!result.success && result.error) {
        console.error('Erro no signInWithGoogle:', result.error);
        setError(`Erro no login: ${result.error}`);
      } else {
        console.log('Login Google iniciado com sucesso');
        // O redirecionamento será feito pelo Google OAuth
      }
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      setError("Erro ao conectar com Google. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">FLV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema FLV</h1>
          <p className="text-gray-600 text-sm">Super Dal Pozzo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
              >
                <Chrome className="w-4 h-4" />
                <span>{loading ? "Conectando..." : "Entrar com Google"}</span>
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Sistema unificado com Google Auth
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Para funcionários:</strong> Entre em contato com o TI para receber o convite por email</p>
              <p><strong>Master:</strong> Use o email dalpozzo.ti@gmail.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;