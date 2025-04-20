import { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

const MfaSettings = () => {
  const { user, enrollMfa, verifyMfa, unenrollMfa, isMfaRequired } = useAuth();
  const [enrollmentStep, setEnrollmentStep] = useState<'idle' | 'enrolling' | 'verifying'>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [enrollmentData, setEnrollmentData] = useState<{ qr: string; secret: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start MFA enrollment process
  const handleStartEnrollment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await enrollMfa();
      setEnrollmentData(data);
      setEnrollmentStep('enrolling');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el proceso de configuración de 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the MFA code
  const handleVerifyMfa = async () => {
    if (!verificationCode.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const success = await verifyMfa(verificationCode);
      if (success) {
        setEnrollmentStep('idle');
        setEnrollmentData(null);
        setVerificationCode('');
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  // Disable MFA
  const handleDisableMfa = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await unenrollMfa();
      if (success) {
        setEnrollmentStep('idle');
      }
    } catch (err: any) {
      setError(err.message || 'Error al desactivar 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel enrollment process
  const handleCancelEnrollment = () => {
    setEnrollmentStep('idle');
    setEnrollmentData(null);
    setVerificationCode('');
    setError(null);
  };

  if (!user) {
    return null;
  }

  const required = isMfaRequired();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {user.hasMfa ? (
            <ShieldCheck className="h-5 w-5 text-green-500" />
          ) : (
            <Shield className="h-5 w-5 text-gray-500" />
          )}
          Autenticación de dos factores (2FA)
        </CardTitle>
        <CardDescription>
          Aumenta la seguridad de tu cuenta añadiendo una capa adicional de protección.
          {required && !user.hasMfa && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuración requerida</AlertTitle>
              <AlertDescription>
                Como administrador, debes activar la autenticación de dos factores para mayor seguridad.
              </AlertDescription>
            </Alert>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {enrollmentStep === 'idle' && (
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    {user.hasMfa
                      ? 'La autenticación de dos factores está activada'
                      : 'La autenticación de dos factores está desactivada'}
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    {user.hasMfa ? (
                      <p>
                        Tu cuenta está protegida con autenticación de dos factores. Cada vez que inicies sesión,
                        necesitarás tu contraseña y un código de verificación de tu aplicación de autenticación.
                      </p>
                    ) : (
                      <p>
                        Con la autenticación de dos factores, necesitarás tanto tu contraseña como un código
                        de verificación de una aplicación como Google Authenticator para iniciar sesión.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {enrollmentStep === 'enrolling' && enrollmentData && (
          <div className="space-y-4">
            <p className="text-sm">
              Escanea el código QR con una aplicación de autenticación como Google Authenticator, 
              Authy o Microsoft Authenticator.
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-2 rounded-md">
                <img src={enrollmentData.qr} alt="QR Code for MFA" className="w-48 h-48" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Código secreto (si no puedes escanear el código QR):</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                {enrollmentData.secret}
              </code>
            </div>
            <Button onClick={() => setEnrollmentStep('verifying')} className="w-full">
              Continuar
            </Button>
            <Button onClick={handleCancelEnrollment} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {enrollmentStep === 'verifying' && (
          <div className="space-y-4">
            <p className="text-sm">
              Ingresa el código de verificación de 6 dígitos de tu aplicación de autenticación.
            </p>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Código de verificación"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
            />
            <div className="flex space-x-2">
              <Button onClick={handleVerifyMfa} disabled={isLoading} className="flex-1">
                {isLoading ? 'Verificando...' : 'Verificar'}
              </Button>
              <Button onClick={handleCancelEnrollment} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {enrollmentStep === 'idle' && (
          user.hasMfa ? (
            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={isLoading || (required && user.hasMfa)}
              className="ml-auto"
            >
              {isLoading ? 'Procesando...' : 'Desactivar 2FA'}
            </Button>
          ) : (
            <Button
              onClick={handleStartEnrollment}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? 'Procesando...' : 'Activar 2FA'}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
};

export default MfaSettings; 