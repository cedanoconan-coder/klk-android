# Auditoría inicial de rendimiento y seguridad — 13 nov 2026

Estado: revisión estática, sin cambios en producción.

## Hallazgos comprobados
- `calls.js` establece dos listeners persistentes en `watchCallContacts(uid)`: consulta global de `publicProfiles` con `directoryVisible == true` y conversaciones del usuario. Esto puede aumentar lecturas al crecer el directorio. Medir primero; no eliminar la escucha de llamadas entrantes.
- `calls.js` implementa cancelación de múltiples listeners (`incomingUnsub`, `activeCallUnsub`, `callPeopleUnsub`, `callConversationUnsub`, listeners de candidatos). Revisar el ciclo de vida en navegación y cambios de sesión antes de modificar.
- `functions/index.js` define `notifyIncomingCall`, pero su despliegue depende de Cloud Functions y facturación. No desplegar ni activar Blaze sin autorización.
- `sw.js` tiene un manejador para mensajes FCM en segundo plano; los mensajes normales llegan según las pruebas del propietario. No cambiar su configuración durante esta fase.
- `firestore.rules` contiene controles de autenticación y permisos. No asumir que todas las reglas son seguras sin pruebas de emulador.

## Plan seguro
1. Ejecutar pruebas de reglas en Firebase Emulator Suite sin acceso a producción.
2. Medir lecturas de Firestore con 2 dispositivos, apertura/cierre de Llamadas, Chats y cierre de sesión.
3. Verificar que ningún listener persista tras cerrar sesión y que no haya duplicados al cambiar de pestaña.
4. Revisar consultas de directorio, permisos de contactos, y acceso a llamadas de terceros.
5. Hacer cambios mínimos por separado, con pruebas de regresión para voz, video, mensajes y notificaciones.
6. Fusionar únicamente tras aprobación y pruebas; no desplegar funciones de pago.

## Restricciones
- Mantener intacta la versión pública.
- No habilitar Blaze ni servicios de pago.
- No alterar las notificaciones de mensajes existentes.
- No afirmar mejoras de rendimiento sin mediciones.
