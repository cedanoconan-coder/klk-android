# klk — Chat familiar

Aplicación web instalable (PWA) para iniciar sesión y conversar en un chat familiar.

## Tecnologías
- HTML, CSS y JavaScript
- Firebase Authentication (correo y contraseña)
- Cloud Firestore
- Service Worker y Web App Manifest

## Archivos principales
- `index.html`: interfaz, autenticación y chat.
- `manifest.webmanifest`: configuración de instalación.
- `icon.svg`: icono de la aplicación.
- `sw.js`: caché básica de la aplicación.
- `firestore.rules`: reglas de seguridad propuestas para Firestore.
- `firebase.json`: configuración para Firebase CLI.
- `.github/workflows/pages.yml`: publicación automática en GitHub Pages.

## Pasos pendientes para activar el servicio
1. En Firebase Console, abrir el proyecto `klk-familia`.
2. Confirmar que Authentication tenga habilitado el proveedor **Correo electrónico/Contraseña**.
3. Crear la base de datos de Cloud Firestore.
4. Publicar las reglas de `firestore.rules` desde Firebase Console o con Firebase CLI.
5. En GitHub, abrir **Settings → Pages** y seleccionar **GitHub Actions** como fuente de publicación.
6. Esperar a que el flujo **Publicar klk en GitHub Pages** termine correctamente.

## Seguridad
Las reglas incluidas requieren que el usuario haya iniciado sesión y validan que cada mensaje pertenezca al usuario autenticado. Esta primera versión permite que cualquier cuenta autenticada del proyecto lea el chat; para un chat estrictamente privado entre familiares se debe añadir una lista administrada de miembros autorizados antes de invitar a otras personas.

## Instalar en Android
Cuando GitHub Pages publique el sitio por HTTPS, abrir la dirección en Chrome para Android y usar el menú **⋮ → Instalar aplicación** o **Añadir a pantalla de inicio**, según la versión de Chrome.

Esta versión es una PWA. No es todavía un APK nativo.
