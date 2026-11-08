# Activar el asistente de IA de klk

El cliente y la función segura `klk-assistant` ya están integrados. Para activar respuestas reales de IA, añade la clave del proveedor como secreto del servidor.

## 1. Crear una clave de OpenAI API

1. Abre https://platform.openai.com/api-keys e inicia sesión.
2. Crea una clave API para klk.
3. Revisa la facturación y establece un límite de gasto adecuado. La facturación de la API es independiente de una suscripción de ChatGPT.

## 2. Guardar la clave en Supabase

1. Abre el proyecto **Klk-familia**: https://supabase.com/dashboard/project/nrnqzzhhvjramxkahkqs
2. Entra en **Edge Functions → Secrets**.
3. Añade un secreto con este nombre exacto: `OPENAI_API_KEY`.
4. Pega el valor de la clave API y guarda.

No compartas esta clave por chat, WhatsApp ni GitHub. No la pongas en `index.html`, el APK ni en archivos públicos.

La función usa `gpt-4.1-mini` por defecto. Opcionalmente puedes crear el secreto `OPENAI_MODEL` con otro modelo habilitado para tu cuenta.

## 3. Comprobar desde klk

1. Abre https://cedanoconan-coder.github.io/klk-android/
2. Inicia sesión.
3. Entra en **Herramientas → Asistente IA**.
4. Pulsa **Comprobar IA**. Debe indicar que el servidor está configurado.
5. Pulsa **Revisar y reparar** y luego envía una consulta de prueba.

## Qué puede reparar automáticamente

La revisión local puede renovar una sesión Firebase caducada y solicitar una actualización del Service Worker. También detecta conexión, HTTPS, compatibilidad de micrófono, WebRTC y notificaciones.

Los cambios de código, reglas de base de datos y configuración de producción no se ejecutan automáticamente desde una conversación de IA. Primero se deben revisar y probar para evitar que una reparación dañe chats, cuentas o llamadas.

## Privacidad y límites

La función exige un token de sesión Firebase válido, limita las consultas por usuario y no guarda el historial del asistente en el servidor. El diagnóstico compartido con la IA contiene únicamente indicadores técnicos básicos. No envíes contraseñas, códigos de invitación ni información privada de tus chats.
