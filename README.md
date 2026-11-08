# klk — Mensajería privada individual

Aplicación web instalable (PWA) para iniciar sesión y mantener conversaciones privadas individuales entre dos cuentas.

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

## Pasos pendientes para activar el servicio
1. En Firebase Console, abrir el proyecto `klk-familia`.
2. Confirmar que Authentication tenga habilitado el proveedor **Correo electrónico/Contraseña**.
3. Crear la base de datos de Cloud Firestore.
4. Publicar las reglas de `firestore.rules` desde Firebase Console o con Firebase CLI.
5. En GitHub, abrir **Settings → Pages** y seleccionar **GitHub Actions** como fuente de publicación.
6. Esperar a que el flujo **Publicar klk en GitHub Pages** termine correctamente.

## Seguridad
Las reglas incluidas requieren autenticación y limitan la lectura y escritura de cada conversación a sus dos miembros. Los perfiles son visibles para usuarios autenticados para poder descubrir contactos. Las consultas de llamadas entrantes se limitan al destinatario; el emisor accede a su llamada mediante el documento individual.

## Instalar en Android
Cuando GitHub Pages publique el sitio por HTTPS, abrir la dirección en Chrome para Android y usar el menú **⋮ → Instalar aplicación** o **Añadir a pantalla de inicio**, según la versión de Chrome.

El repositorio incluye un flujo de GitHub Actions (`.github/workflows/android-apk.yml`) que genera un APK de prueba con Capacitor y conserva el logo klk. El APK se descarga desde Actions → ejecución del flujo → Artifacts. El flujo se ejecuta en `main` y en la rama `integrar-supabase-storage`; el APK solo debe compartirse después de verificar que el backend esté configurado y que el inicio de sesión, las fotos y las notas de voz funcionen.
