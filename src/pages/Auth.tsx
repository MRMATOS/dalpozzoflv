
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(1, "Nome é obrigatório"),
  loja: z.string().min(1, "Loja é obrigatória"),
  codigo_acesso: z.string().min(3, "Código de acesso deve ter pelo menos 3 caracteres"),
  tipo: z.enum(['master', 'comprador', 'requisitante', 'estoque'])
});

const Auth = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    nome: '',
    loja: '',
    codigo_acesso: '',
    tipo: 'requisitante' as const
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, loading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    // Validate input
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    const loginResult = await signIn(loginData.email, loginData.password);
    
    if (loginResult.success) {
      navigate("/dashboard");
    } else {
      setError(loginResult.error || "Erro desconhecido");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    // Validate input
    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    const signupResult = await signUp(signupData.email, signupData.password, {
      nome: signupData.nome,
      loja: signupData.loja,
      codigo_acesso: signupData.codigo_acesso,
      tipo: signupData.tipo
    });
    
    if (signupResult.success) {
      setError("");
      // Show success message
      setError("Conta criada com sucesso! Verifique seu email para confirmar.");
    } else {
      setError(signupResult.error || "Erro desconhecido");
    }
  };

  const generateAccessCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSignupData({ ...signupData, codigo_acesso: code });
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
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Registrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="loginEmail" className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="Digite seu email"
                      autoComplete="email"
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="loginPassword" className="text-sm font-medium text-gray-700">
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-sm text-red-600">{validationErrors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signupEmail" className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="Digite seu email"
                      autoComplete="email"
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signupPassword" className="text-sm font-medium text-gray-700">
                      Senha
                    </label>
                    <Input
                      id="signupPassword"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-red-600">{validationErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="nome" className="text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <Input
                      id="nome"
                      value={signupData.nome}
                      onChange={(e) => setSignupData({ ...signupData, nome: e.target.value })}
                      placeholder="Digite seu nome completo"
                    />
                    {validationErrors.nome && (
                      <p className="text-sm text-red-600">{validationErrors.nome}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="loja" className="text-sm font-medium text-gray-700">
                      Loja
                    </label>
                    <Input
                      id="loja"
                      value={signupData.loja}
                      onChange={(e) => setSignupData({ ...signupData, loja: e.target.value })}
                      placeholder="Digite o nome da loja"
                    />
                    {validationErrors.loja && (
                      <p className="text-sm text-red-600">{validationErrors.loja}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="codigo_acesso" className="text-sm font-medium text-gray-700">
                      Código de Acesso
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        id="codigo_acesso"
                        value={signupData.codigo_acesso}
                        onChange={(e) => setSignupData({ ...signupData, codigo_acesso: e.target.value })}
                        placeholder="Código único"
                      />
                      <Button type="button" variant="outline" onClick={generateAccessCode}>
                        Gerar
                      </Button>
                    </div>
                    {validationErrors.codigo_acesso && (
                      <p className="text-sm text-red-600">{validationErrors.codigo_acesso}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
                      Tipo de Usuário
                    </label>
                    <Select value={signupData.tipo} onValueChange={(value: any) => setSignupData({ ...signupData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requisitante">Requisitante</SelectItem>
                        <SelectItem value="estoque">Estoque</SelectItem>
                        <SelectItem value="comprador">Comprador</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.tipo && (
                      <p className="text-sm text-red-600">{validationErrors.tipo}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant={error.includes("sucesso") ? "default" : "destructive"} className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
