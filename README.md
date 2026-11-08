# klk — Chat privado

klk es una aplicación web instalable (PWA) preparada para empaquetarse como APK Android. Su objetivo es permitir conversaciones privadas entre dos personas que se aceptan como contactos.

## Funciones incluidas en esta rama

- Registro, inicio de sesión y recuperación de contraseña con Firebase Authentication (correo y contraseña).
- Perfil básico de usuario y búsqueda por correo de personas registradas.
- Solicitudes de contacto con aceptar o rechazar.
- Conversaciones privadas de dos miembros, creadas al aceptar una solicitud.
- Mensajes de texto en tiempo real.
- Envío de imágenes y archivos de audio por Firebase Storage.
- Grabación y envío de notas de voz desde el navegador/dispositivo.
- Señalización de llamadas de voz y videollamadas mediante WebRTC y Firestore.
- Reglas de Firestore y Storage limitadas a los miembros de cada conversación.
- PWA instalable y workflow de GitHub Actions para validar JavaScript y compilar un APK debug.

## Servicios que debes habilitar en Firebase

1. Authentication → Sign-in method → **Correo electrónico/Contraseña**.
2. Cloud Firestore → crear la base de datos.
3. Firebase Storage → crear el bucket del proyecto.
4. Publicar las reglas y los índices de este repositorio:
   - `firestore.rules`
   - `storage.rules`
   - `firestore.indexes.json`

Desde Firebase Console, abre Firestore → Rules y copia el contenido de `firestore.rules`; abre Storage → Rules y copia `storage.rules`. Para índices, despliega `firestore.indexes.json` con Firebase CLI (`firebase deploy --only firestore:indexes`). Para desplegar reglas e índices juntos con Firebase CLI: `firebase deploy --only firestore:rules,firestore:indexes,storage`.

El proyecto Firebase configurado en la app es `klk-familia`. No publiques reglas hasta revisar que el proyecto seleccionado en Firebase Console sea ese.

## Privacidad y cifrado

El directorio de usuarios de esta primera versión permite a cualquier usuario autenticado consultar los perfiles básicos para buscar contactos por correo; por eso, los correos registrados no deben tratarse como privados frente a otras cuentas del mismo proyecto. Los mensajes están protegidos por reglas de acceso para miembros, pero todavía no tienen cifrado de extremo a extremo como WhatsApp: el proyecto Firebase y sus administradores de confianza pueden acceder a los datos almacenados.

## Llamadas

La rama incluye señalización WebRTC de voz y video usando Firestore y el servidor STUN público de Google. Esto permite iniciar pruebas, pero **no garantiza conexión en todas las redes**. Para llamadas confiables en redes móviles, NAT estrictos o firewalls, configura un servidor TURN (por ejemplo, coturn o un proveedor TURN) y agrega sus credenciales a la configuración ICE. Las llamadas todavía necesitan pruebas entre dos dispositivos reales. Las notificaciones push de llamadas no están implementadas; el usuario debe tener la app abierta para recibir la señalización en tiempo real.

## Validación y APK

El workflow `.github/workflows/android-apk.yml` se ejecuta en Pull Requests hacia `main`, en pushes a `main` y a la rama de trabajo, y manualmente desde Actions. Valida la sintaxis del JavaScript y construye un APK debug con Capacitor. El APK queda como artefacto descargable del workflow si la compilación termina correctamente.

Para publicar la PWA en GitHub Pages, configura Settings → Pages → GitHub Actions. El workflow de Pages publica desde `main`.

## Pruebas obligatorias antes de darla por terminada

- Publicar reglas e índices en Firebase.
- Crear dos cuentas distintas en dos dispositivos.
- Verificar solicitud, aceptación y rechazo de contacto.
- Comprobar que una cuenta ajena no puede leer contactos, conversaciones, mensajes ni archivos.
- Probar texto, imagen, nota de voz, llamada de voz y videollamada.
- Repetir las llamadas usando datos móviles y Wi-Fi; configurar TURN si no conectan.
- Instalar el APK en Android y comprobar permisos de micrófono/cámara.

Esta rama no debe considerarse lista para producción hasta completar esas pruebas.