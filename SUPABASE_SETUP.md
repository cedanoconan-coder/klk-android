# Integración de Supabase Storage para klk

Firebase Authentication y Cloud Firestore siguen gestionando las cuentas y los mensajes. Supabase Storage guarda fotos y notas de voz.

## Configuración necesaria en Supabase

1. El bucket `Chat-media` ya existe en el proyecto y está configurado como **Private**.
2. El límite del bucket se configuró en 20 MB. La función y el cliente aplican además 10 MB para imágenes y 20 MB para audio.
3. La Edge Function usa las variables gestionadas por Supabase (`SUPABASE_URL` y `SUPABASE_SECRET_KEYS`, con compatibilidad para `SUPABASE_SERVICE_ROLE_KEY`). El ID del proyecto Firebase `klk-familia` está configurado como valor predeterminado en el código; no hay que copiar claves secretas al cliente.
4. La función `media` debe desplegarse con `verify_jwt=false`, porque el cliente envía un ID token de Firebase en `Authorization`; la función valida ese token internamente con las claves públicas de Google.
5. El `index.html` de la rama de integración ya contiene la URL del proyecto y su clave **Publishable**. Esa clave es pública y puede estar en el cliente. Nunca coloques una clave Secret/service_role en HTML, APK ni GitHub.

## Publicar reglas de Firestore

Revisa el archivo `firestore.rules` y publícalo desde Firebase Console → Firestore Database → Rules → Publish. Las nuevas reglas guardan la ruta privada del archivo, no una URL pública.

## Pruebas obligatorias antes de usar la versión nueva

- Iniciar sesión con dos cuentas familiares.
- Enviar una foto y abrirla desde la otra cuenta.
- Grabar, enviar y reproducir una nota de voz desde la otra cuenta.
- Confirmar que se rechazan fotos de más de 10 MB y audios de más de 20 MB.
- Confirmar que un usuario sin sesión no puede solicitar enlaces firmados.
- Cerrar y volver a abrir la app para comprobar que los archivos siguen cargando.

La integración del cliente está preparada en la rama `integrar-supabase-storage`. El bucket y la clave Publishable ya están comprobados. No debe publicarse como versión final hasta desplegar la función, publicar las reglas de Firestore y completar las pruebas con dos cuentas.
