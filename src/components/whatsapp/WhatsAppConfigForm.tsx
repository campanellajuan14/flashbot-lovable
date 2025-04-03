
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormDescription, 
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WhatsAppFormValues {
  phoneNumberId: string;
  wabaId: string;
  apiToken: string;
}

export const WhatsAppConfigForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<WhatsAppFormValues>({
    defaultValues: {
      phoneNumberId: '',
      wabaId: '',
      apiToken: '',
    }
  });

  const onSubmit = async (values: WhatsAppFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para configurar WhatsApp",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('save-whatsapp-config', {
        body: {
          phone_number_id: values.phoneNumberId,
          waba_id: values.wabaId,
          api_token: values.apiToken
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de WhatsApp se ha guardado correctamente",
      });

      // Limpiar el campo del token después de guardarlo exitosamente
      form.setValue('apiToken', '');

    } catch (error: any) {
      console.error("Error guardando la configuración de WhatsApp:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la configuración de WhatsApp",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuración de WhatsApp Business</CardTitle>
        <CardDescription>
          Conecta tu cuenta de WhatsApp Business API para recibir y responder mensajes automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phoneNumberId"
              rules={{ required: "El Phone Number ID es obligatorio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 123456789012345"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    ID numérico de tu número de WhatsApp en Meta Business Suite
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="wabaId"
              rules={{ required: "El WhatsApp Business Account ID es obligatorio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Business Account ID (WABA ID)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 123456789012345"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    ID de tu cuenta de WhatsApp Business en Meta Business Suite
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiToken"
              rules={{ required: "El token de API es obligatorio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token de API</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Tu token de API de WhatsApp"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Token de acceso permanente o temporal generado en Meta for Developers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 items-start text-sm border-t pt-4">
        <div className="space-y-1">
          <h4 className="font-medium">¿Dónde encuentro estos datos?</h4>
          <p className="text-muted-foreground">
            Visita <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline text-primary">Meta for Developers</a> para crear una app y obtener tus credenciales.
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            Necesitarás configurar tu webhook en Meta Business Suite después de guardar la configuración.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppConfigForm;
