
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredResource?: string;
  requiredAction?: 'view' | 'edit' | 'create' | 'delete';
  // Manter compatibilidade com sistema antigo
  requiredRole?: string;
  allowedTypes?: string[];
}

const ProtectedRoute = ({ 
  children, 
  requiredResource, 
  requiredAction = 'view',
  requiredRole,
  allowedTypes 
}: ProtectedRouteProps) => {
  const { user, profile, loading, hasRole } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is active
  if (!profile.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Conta Inativa</h2>
          <p className="text-gray-600 mb-4">Sua conta foi desativada. Entre em contato com o administrador.</p>
          <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Novo sistema de permissões granulares
  if (requiredResource) {
    const hasRequiredPermission = hasPermission(
      requiredResource as any, 
      requiredAction
    );

    if (!hasRequiredPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para {requiredAction === 'view' ? 'visualizar' : 'acessar'} este recurso.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      );
    }
  }

  // Sistema antigo - manter compatibilidade
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check allowed types if specified
  if (allowedTypes && allowedTypes.length > 0) {
    const hasAllowedType = allowedTypes.some(type => hasRole(type));
    if (!hasAllowedType) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
            <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
