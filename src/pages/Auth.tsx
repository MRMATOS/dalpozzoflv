import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Chrome } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
const Auth = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const {
    user,
    signInWithGoogle
  } = useAuth();
  const navigate = useNavigate();

  // Process OAuth callback and clean URL
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;

      // Check if we have OAuth tokens in the URL
      if (hash && hash.includes('access_token')) {
        console.log('Processando callback do OAuth...');
        setIsProcessingCallback(true);
        try {
          // Let Supabase handle the session from URL
          const {
            data,
            error
          } = await supabase.auth.getSession();
          if (error) {
            console.error('Erro ao processar callback OAuth:', error);
            setError('Erro na autenticação. Tente novamente.');
          } else if (data.session) {
            console.log('Session obtida com sucesso');
            // Clean the URL by removing the hash
            window.history.replaceState(null, '', window.location.pathname);

            // Small delay to ensure auth state is updated
            setTimeout(() => {
              navigate("/dashboard", {
                replace: true
              });
            }, 100);
            return;
          }
        } catch (err) {
          console.error('Erro no processamento do callback:', err);
          setError('Erro na autenticação. Tente novamente.');
        } finally {
          setIsProcessingCallback(false);
        }
      }
    };
    handleOAuthCallback();
  }, [navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isProcessingCallback) {
      // Verificar se usuário está pendente de aprovação
      if ((user as any).pendingApproval) {
        console.log('Usuário pendente de aprovação, redirecionando');
        navigate("/pending-approval", {
          replace: true
        });
      } else {
        console.log('Usuário autenticado, redirecionando para dashboard');
        navigate("/dashboard", {
          replace: true
        });
      }
    }
  }, [user, navigate, isProcessingCallback]);
  const handleGoogleLogin = async () => {
    // Don't allow new login attempts while processing callback
    if (isProcessingCallback) return;
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
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">FLV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema FLV</h1>
          <p className="text-gray-600 text-sm">Verdura Super Fácil</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button type="button" onClick={handleGoogleLogin} disabled={loading || isProcessingCallback} className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2">
                <Chrome className="w-4 h-4" />
                <span>
                  {isProcessingCallback ? "Processando..." : loading ? "Conectando..." : "Entrar com Google"}
                </span>
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Sistema unificado com Google Auth
              </p>
            </div>

            {error && <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Para funcionários:</strong> Faça o login com sua conta Google e aguarde aprovação.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Auth;