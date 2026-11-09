# klk — Chat familiar

Aplicación web instalable (PWA) para iniciar sesión y conversar en un chat familiar.

## Tecnologías
- HTML, CSS y JavaScript
- Firebase Authentication (correo y contraseña)
- Cloud Firestore
- Supabase Storage para fotos y notas de voz
- Capacitor para generar una aplicación Android instalable

## Archivos principales
- `index.html`: interfaz, autenticación y chat.
- `manifest.webmanifest`: configuración de instalación.
- `icon.svg`: icono de la aplicación.
- `sw.js`: caché básica de la aplicación.
- `firestore.rules`: reglas de seguridad propuestas para Firestore.
- `firebase.json`: configuración para Firebase CLI.
- `.github/workflows/pages.yml`: publicación automática en GitHub Pages.
- `.github/workflows/android-apk.yml`: compilación automática de un APK de prueba para Android.

## Estado de publicación (8 de noviembre de 2026)

- **GitHub Pages:** publicado correctamente desde `main`. URL: https://cedanoconan-coder.github.io/klk-android/
- **APK Android:** compilación de prueba completada correctamente. El artefacto `klk-android-apk` está disponible en GitHub Actions durante 30 días.
- **Código:** commit publicado `76482f05ab55812e64e72a74fcfed822844cde4d`.

## Pasos externos pendientes para activar el backend

La publicación web y la compilación Android ya están completadas. Para que los usuarios puedan registrarse y conversar, falta confirmar en Firebase Console:

1. Abrir el proyecto `klk-familia`.
2. Habilitar **Authentication → Correo electrónico/Contraseña**.
3. Crear la base de datos de **Cloud Firestore**.
4. Publicar las reglas del archivo `firestore.rules`.
5. Confirmar que el servicio de carga firmado de Supabase está desplegado y que el bucket `Chat-media` existe.

Estos pasos requieren acceso autorizado a las consolas Firebase y Supabase; no se pueden completar desde este repositorio ni se deben simular como realizados.

## Seguridad y acceso

- El registro de cuentas requiere un código de invitación de un solo uso.
- Los perfiles privados solo los puede leer su propietario.
- El directorio público solo muestra perfiles con `directoryVisible: true`; la opción queda activada por defecto y cada miembro puede desactivarla.
- Los chats son conversaciones privadas de dos miembros. Un miembro puede iniciar el chat directamente desde un perfil visible, sin solicitudes ni aceptación de amistad.
- Solo los dos participantes pueden leer o escribir mensajes y archivos de esa conversación.
- La colección heredada `contactRequests` está bloqueada.
- Los estados, sus reacciones y visualizaciones están disponibles para miembros autenticados de klk.
- Las reglas nuevas están en `firestore.rules` y deben publicarse en Firebase después de integrar los cambios.

## Servicios backend

- El proyecto Supabase `Klk-familia` está activo.
- La Edge Function `media` está activa en la versión 12 y conserva la validación de sesión Firebase.
- La función `klk-push` está activa en la versión 2.
- Los registros recientes confirman cargas y lecturas correctas en el bucket privado `Chat-media`, incluidas notas de voz WebM.

## Instalar en Android
Cuando GitHub Pages publique el sitio por HTTPS, abrir la dirección en Chrome para Android y usar el menú **⋮ → Instalar aplicación** o **Añadir a pantalla de inicio**, según la versión de Chrome.

El repositorio incluye un flujo de GitHub Actions (`.github/workflows/android-apk.yml`) que genera un APK de prueba con Capacitor y conserva el logo klk. El APK se descarga desde Actions → ejecución del flujo → Artifacts. El flujo se ejecuta en `main` y en la rama `integrar-supabase-storage`; el APK solo debe compartirse después de verificar que el backend esté configurado y que el inicio de sesión, las fotos y las notas de voz funcionen.
