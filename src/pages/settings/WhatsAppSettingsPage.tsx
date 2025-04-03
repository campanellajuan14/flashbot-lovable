
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Settings, History } from 'lucide-react';
import WhatsAppConfigForm from '@/components/whatsapp/WhatsAppConfigForm';
import WhatsAppStatus from '@/components/whatsapp/WhatsAppStatus';
import WhatsAppMessagesTab from './components/WhatsAppMessagesTab';

const WhatsAppSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('config');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1>
          <p className="text-muted-foreground mt-2">
            Integra tu cuenta de WhatsApp Business API para ofrecer respuestas automáticas a los mensajes.
          </p>
        </div>
        
        <Separator />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <History className="h-4 w-4" />
              Historial de Mensajes
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Guía
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WhatsAppConfigForm />
              <WhatsAppStatus />
            </div>
          </TabsContent>
          
          <TabsContent value="messages">
            <WhatsAppMessagesTab />
          </TabsContent>
          
          <TabsContent value="help">
            <div className="bg-muted/50 rounded-lg p-6 border">
              <h3 className="text-xl font-medium mb-4">Guía de Integración de WhatsApp</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">1. Requisitos previos</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-medium">Cuenta Meta for Developers</span>
                      <p className="text-muted-foreground text-sm">Necesitas una cuenta en Meta for Developers para crear tu aplicación.</p>
                    </li>
                    <li>
                      <span className="font-medium">Cuenta WhatsApp Business</span>
                      <p className="text-muted-foreground text-sm">Debes tener una cuenta de WhatsApp Business verificada.</p>
                    </li>
                    <li>
                      <span className="font-medium">Número de teléfono</span>
                      <p className="text-muted-foreground text-sm">Un número de teléfono verificado y aprobado por Meta para WhatsApp Business.</p>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">2. Crear una aplicación en Meta Developers</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <span className="font-medium">Accede a Meta for Developers</span>
                      <p className="text-muted-foreground text-sm">
                        Ve a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://developers.facebook.com/apps</a> e inicia sesión.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Crea una nueva aplicación</span>
                      <p className="text-muted-foreground text-sm">
                        Selecciona "Crear aplicación" y elige "Business" como el tipo de aplicación.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Añade WhatsApp</span>
                      <p className="text-muted-foreground text-sm">
                        En el panel de configuración, busca y añade el producto "WhatsApp" a tu aplicación.
                      </p>
                    </li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">3. Obtener credenciales</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <span className="font-medium">Phone Number ID</span>
                      <p className="text-muted-foreground text-sm">
                        En la sección de WhatsApp, encontrarás un ID numérico asociado a tu número de teléfono.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">WhatsApp Business Account ID (WABA ID)</span>
                      <p className="text-muted-foreground text-sm">
                        Puedes encontrarlo en la sección de configuración de tu cuenta de WhatsApp Business.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Token de API</span>
                      <p className="text-muted-foreground text-sm">
                        Genera un token permanente en la sección de "Generar token".
                      </p>
                    </li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">4. Configurar Webhook</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <span className="font-medium">Configurar los webhooks</span>
                      <p className="text-muted-foreground text-sm">
                        En la pestaña de Webhooks, configura un nuevo webhook.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">URL del Callback</span>
                      <p className="text-muted-foreground text-sm">
                        Usa la URL del webhook que se muestra en la sección de "Estado de WhatsApp".
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Token de verificación</span>
                      <p className="text-muted-foreground text-sm">
                        Usa el token de verificación generado que se muestra en la sección de "Estado de WhatsApp".
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Campos a suscribir</span>
                      <p className="text-muted-foreground text-sm">
                        Asegúrate de seleccionar al menos "messages" y "message_statuses".
                      </p>
                    </li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-medium">5. Activación final</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      <span className="font-medium">Guardar configuración</span>
                      <p className="text-muted-foreground text-sm">
                        Una vez ingresadas las credenciales, guarda la configuración.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Asignar un chatbot</span>
                      <p className="text-muted-foreground text-sm">
                        Ve a la sección de "WhatsApp" en la página de detalles de tu chatbot y actívalo para WhatsApp.
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Probar</span>
                      <p className="text-muted-foreground text-sm">
                        Envía un mensaje a tu número de WhatsApp Business para verificar que todo funciona correctamente.
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppSettingsPage;
