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

## Estado de publicación (9 de noviembre de 2026)

- **GitHub Pages:** la versión pública actual sigue sirviendo la rama `main`: https://cedanoconan-coder.github.io/klk-android/
- **Correcciones:** preparadas en el PR [#22](https://github.com/cedanoconan-coder/klk-android/pull/22); todavía no integradas en `main`.
- **Supabase:** proyecto `Klk-familia` activo; Edge Function `media` en versión 12 y `klk-push` en versión 2.
- **Storage:** el bucket privado `Chat-media` ya registra cargas y lecturas correctas, incluidas notas de voz WebM.
- **APK:** el flujo de Android está configurado para compilar también la rama de correcciones; falta confirmar el resultado de esa compilación.

## Pasos pendientes para publicar las correcciones

1. Revisar y aprobar las comprobaciones del PR #22.
2. Integrar el PR en `main` para que GitHub Pages publique la nueva versión.
3. Publicar el archivo `firestore.rules` actualizado en Firebase Console.
4. Confirmar la compilación del APK y probar mensajes, notas de voz, fotos, estados y llamadas con dos cuentas reales.

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

El repositorio incluye un flujo de GitHub Actions (`.github/workflows/android-apk.yml`) que genera un APK de prueba con Capacitor y conserva el logo klk. El APK se descarga desde Actions → ejecución del flujo → Artifacts. El flujo se ejecuta en `main`, `integrar-supabase-storage` y `fix/integral-klk-reliability`; el APK solo debe compartirse después de verificar el backend y probar inicio de sesión, mensajes, fotos y notas de voz.
