# Integración de Supabase Storage para klk

Esta integración mantiene Firebase Authentication y Cloud Firestore. Supabase se usa únicamente para guardar fotos y notas de voz.

## Diseño de seguridad

- El bucket `klk-media` debe ser **privado**.
- La app nunca recibe ni contiene la clave `service_role`.
- La Edge Function valida cada Firebase ID token contra el emisor y la audiencia del proyecto `klk-familia`.
- La función genera rutas con el UID autenticado y URL/token de carga temporal.
- Las descargas usan URL firmada de una hora; la app debe solicitar una nueva URL al volver a cargar mensajes.
- Límites de aplicación: imágenes 10 MB y audios 20 MB.
- Firebase sigue siendo responsable de inicio de sesión y mensajes de texto.

## Crear el proyecto Supabase

1. Crear un proyecto en https://supabase.com/dashboard.
2. Crear un bucket llamado `klk-media` y dejarlo **Private**.
3. Configurar tamaño máximo de archivo en 20 MB.
4. Restringir tipos MIME a imágenes y audio (por ejemplo, `image/*` y `audio/*`).
5. En Project Settings → API, copiar Project URL y la publishable key. La publishable key puede estar en el cliente; nunca copiar la secret/service_role key al HTML ni al repositorio.

## Secretos de la Edge Function

Configurar en Supabase → Edge Functions → Secrets:

- `FIREBASE_PROJECT_ID` = `klk-familia`
- `SUPABASE_SERVICE_ROLE_KEY` = service_role/secret key del proyecto (solo como secreto del servidor)

Supabase proporciona `SUPABASE_URL` automáticamente a Edge Functions.

## Desplegar la función

Desde Supabase CLI, en la raíz del repositorio:

```sh
supabase functions deploy media --no-verify-jwt
```

La función desactiva la validación JWT del gateway porque recibe tokens de Firebase; valida el token de Firebase dentro de la función con las claves públicas oficiales de Google. No omitir esa validación.

## Pendiente antes de activar en la app

- Añadir el Project URL y la publishable key del proyecto Supabase al cliente.
- Sustituir la llamada a Firebase Storage por: pedir URL firmada a la función, cargar con el token temporal y guardar en Firestore el campo `storagePath` (no una URL permanente).
- Al mostrar mensajes de imagen/audio, pedir URL firmada nueva para cada `storagePath`.
- Mantener el HTML sin claves secretas.
- Probar carga, lectura desde otra cuenta familiar, archivo demasiado grande, sesión vencida y usuario no autenticado.

**No se debe activar el nuevo flujo en producción hasta completar los pasos pendientes y probarlo.**
