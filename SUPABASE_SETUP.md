# Integración de Supabase Storage para klk

Firebase Authentication y Cloud Firestore siguen gestionando las cuentas y los mensajes. Supabase Storage guarda fotos y notas de voz.

## Configuración necesaria en Supabase

1. En Storage, crea un bucket llamado `Chat-media` y déjalo **Private**.
2. Configura un máximo de 20 MB por archivo. Si el panel permite restringir MIME, permite imágenes y audio.
3. En Edge Functions → Secrets, agrega:
   - `FIREBASE_PROJECT_ID` = `klk-familia`
   - `SUPABASE_SERVICE_ROLE_KEY` = la clave secreta del proyecto. Solo como secreto del servidor; nunca la pongas en el HTML ni en GitHub.
   Supabase proporciona `SUPABASE_URL` automáticamente.
4. Despliega la Edge Function `media` desde `supabase/functions/media/index.ts` con Supabase CLI: `supabase functions deploy media --no-verify-jwt`. El gateway no valida el JWT de Supabase porque la aplicación envía un ID token de Firebase; la función valida ese token internamente con las claves públicas de Google.
5. En `index.html`, sustituye el texto `PEGA_AQUI_LA_CLAVE_PUBLICABLE` por la clave **Publishable** del proyecto Supabase. Esa clave puede estar en el cliente. Nunca uses la clave Secret/service_role aquí.

## Publicar reglas de Firestore

Revisa el archivo `firestore.rules` y publícalo desde Firebase Console → Firestore Database → Rules → Publish. Las nuevas reglas guardan la ruta privada del archivo, no una URL pública.

## Pruebas obligatorias antes de usar la versión nueva

- Iniciar sesión con dos cuentas familiares.
- Enviar una foto y abrirla desde la otra cuenta.
- Grabar, enviar y reproducir una nota de voz desde la otra cuenta.
- Confirmar que se rechazan fotos de más de 10 MB y audios de más de 20 MB.
- Confirmar que un usuario sin sesión no puede solicitar enlaces firmados.
- Cerrar y volver a abrir la app para comprobar que los archivos siguen cargando.

La integración del cliente está preparada en la rama `integrar-supabase-storage`. No debe publicarse como versión final hasta completar bucket, secretos, función, clave publicable y pruebas.
