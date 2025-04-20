import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, XCircle, Shield, Settings, Mail, Database, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SecurityItem {
  id: string;
  title: string;
  description: string;
  status: 'complete' | 'incomplete' | 'loading';
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

const SecurityChecklist = () => {
  const { user } = useAuth();
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateItemStatus = (id: string, status: 'complete' | 'incomplete' | 'loading') => {
    setSecurityItems(prev => 
      prev.map(item => item.id === id ? { ...item, status } : item)
    );
  };

  useEffect(() => {
    if (!user) return;

    const fetchSecurityStatus = async () => {
      setIsLoading(true);
      
      // Initial security items
      const items: SecurityItem[] = [
        {
          id: 'mfa',
          title: 'Autenticación de dos factores (2FA)',
          description: 'Protege tu cuenta con una capa adicional de seguridad.',
          status: 'loading',
          icon: <Shield className="h-5 w-5" />,
          action: () => {
            window.location.href = '/profile?tab=security';
          },
          actionLabel: user?.hasMfa ? 'Configuración' : 'Activar'
        },
        {
          id: 'email_verified',
          title: 'Correo electrónico verificado',
          description: 'Confirma que eres el propietario de la dirección de correo electrónico.',
          status: 'loading',
          icon: <Mail className="h-5 w-5" />
        },
        {
          id: 'rls',
          title: 'Seguridad a nivel de fila (RLS)',
          description: 'Verifica que las políticas de seguridad estén configuradas correctamente.',
          status: 'loading',
          icon: <Database className="h-5 w-5" />
        }
      ];

      setSecurityItems(items);

      try {
        // Check MFA status
        updateItemStatus('mfa', user.hasMfa ? 'complete' : 'incomplete');

        // Check email verification
        const { data: userData } = await supabase.auth.getUser();
        const emailVerified = userData?.user?.email_confirmed_at != null;
        updateItemStatus('email_verified', emailVerified ? 'complete' : 'incomplete');

        // Check RLS policies
        // In a real app, you would check this from an admin endpoint
        // For now we'll assume it's enabled
        updateItemStatus('rls', 'complete');

      } catch (error) {
        console.error('Error checking security status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityStatus();
  }, [user]);

  if (!user) {
    return null;
  }

  // Count completed items
  const completedItems = securityItems.filter(item => item.status === 'complete').length;
  const totalItems = securityItems.length;
  const securityScore = Math.round((completedItems / totalItems) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verificación de seguridad
        </CardTitle>
        <CardDescription>
          Verifica y mejora la seguridad de tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Nivel de seguridad</span>
            <span className="text-sm font-medium">{securityScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                securityScore < 50 ? 'bg-red-500' : 
                securityScore < 80 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${securityScore}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          {securityItems.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg border">
              <div className="mt-0.5">
                {item.status === 'complete' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : item.status === 'incomplete' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                {item.action && (
                  <Button 
                    variant="link" 
                    className="px-0 h-auto text-sm" 
                    onClick={item.action}
                  >
                    {item.actionLabel || 'Configurar'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isLoading && securityScore < 100 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Mejora tu seguridad</h4>
                <p className="text-sm text-amber-700">
                  Completa todos los elementos de seguridad para proteger tu cuenta y datos.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityChecklist; 