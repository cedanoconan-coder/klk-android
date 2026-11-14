# KLK Manin — videollamadas grupales (máximo 4)

Estado: diseño técnico, **no implementado ni publicado**.

## Auditoría del código existente
- `index.html` carga `calls.js?v=161` y presenta controles de llamada individual.
- `calls.js` utiliza una única instancia `RTCPeerConnection`, `peer`, `callRef` y `remoteVideo`; no admite varios participantes sin rediseño.
- La señalización actual reside en `calls/{callId}` con campos `callerUid` y `calleeUid`. No reutilizar estos documentos para llamadas grupales.
- ICE usa STUN público y TURN opcional `window.KLK_TURN_SERVERS`. Validar TURN antes de pruebas móviles reales.

## Arquitectura propuesta
1. Crear módulo aislado `group-calls.js`, sin modificar el flujo de `klkStartCall` para llamadas individuales.
2. Para el piloto de cuatro participantes, usar malla WebRTC de hasta tres conexiones por usuario. Evaluar SFU si hay problemas de ancho de banda, CPU o batería; no presentar malla como solución garantizada.
3. Documentos `groupCalls/{roomId}`: `hostUid`, `memberUids` (máximo cuatro, sin duplicados), `status`, `createdAt`, `expiresAt`; subcolección `signals/{signalId}` con `fromUid`, `toUid`, `type`, `payload`, `createdAt`. Separar candidatas ICE y evitar escrituras ilimitadas.
4. Autorizar invitaciones solo entre contactos permitidos; exigir autenticación y comprobar bloqueos. Ningún participante puede ampliar `memberUids` sin controles de capacidad y autorización; usar transacciones para evitar carreras.
5. Conectar y desconectar cada peer de forma independiente; limpiar streams, listeners, candidatos y documentos efímeros al salir.
6. UI: mosaico adaptable 1–4, nombres, estado de conexión, micrófono, cámara, colgar y añadir participantes. Permitir entrada y salida sin finalizar la sala.
7. Reacciones y KLK Looks se integrarán después de estabilizar audio/video; difundir eventos por canal de datos a cada peer.

## Plan de implementación
- Etapa 1: esquema Firestore, reglas y pruebas con emulador (lecturas y escrituras ajenas denegadas, límite de cuatro, bloqueo, expiración, carrera de ingreso).
- Etapa 2: `group-calls.js` con sala, invitación, negociación WebRTC, ICE y recuperación ante desconexiones.
- Etapa 3: interfaz y acceso desde chats/llamadas; sin interferir con llamadas individuales.
- Etapa 4: probar 2, 3 y 4 cuentas en teléfonos reales, Android APK y PWA, Wi-Fi/datos móviles, cámara/micrófono, rechazo, salida y reconexión.
- Etapa 5: revisión de rendimiento y costes de TURN; publicar solo tras superar pruebas.

## Criterios de aceptación
- Nunca entran más de cuatro cuentas a una sala.
- Un usuario no invitado no puede leer señalización ni unirse.
- Los cuatro pueden verse y escucharse con permisos concedidos y conectividad compatible.
- Cada participante puede silenciar su micrófono, apagar su cámara y salir sin expulsar al resto.
- Las llamadas individuales, chats y notificaciones siguen funcionando.
- No afirmar soporte con app cerrada hasta implementar y probar la entrega de llamadas entrantes.
