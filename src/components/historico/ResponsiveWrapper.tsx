import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Calendar, BarChart3, List } from 'lucide-react';

interface ResponsiveWrapperProps {
  calendarioTab: React.ReactNode;
  metricasTab: React.ReactNode;
  listaTab: React.ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  calendarioTab,
  metricasTab,
  listaTab,
  activeTab,
  onTabChange
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4 px-4">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="calendario" className="flex items-center gap-1 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="metricas" className="flex items-center gap-1 text-xs">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="lista" className="flex items-center gap-1 text-xs">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="calendario" className="mt-0">
              <Card className="p-2">
                {calendarioTab}
              </Card>
            </TabsContent>

            <TabsContent value="metricas" className="mt-0">
              <Card className="p-2">
                {metricasTab}
              </Card>
            </TabsContent>

            <TabsContent value="lista" className="mt-0">
              <Card className="p-2">
                {listaTab}
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  }

  // Desktop layout (original)
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="metricas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="calendario">
            {calendarioTab}
          </TabsContent>

          <TabsContent value="metricas">
            {metricasTab}
          </TabsContent>

          <TabsContent value="lista">
            {listaTab}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Hook para detectar orientação da tela
export const useScreenOrientation = () => {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
};

// Componente para otimizar exibição de tabelas em mobile
export const ResponsiveTable: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const isMobile = useIsMobile();
  
  if (isMobile && fallback) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};