# KLK Momentos — etapa 3: contrato de consentimiento

Estado: diseño técnico para implementación y pruebas. **No desplegar sin pruebas del emulador.**

## Modelo de acceso
- La galería personal IndexedDB sigue siendo local. Nunca se suben recuerdos existentes automáticamente.
- Una galería compartida pertenece a una conversación de exactamente dos UID; los UID se derivan de Firebase Auth, nunca de campos arbitrarios del cliente.
- El consentimiento es independiente de pertenecer a un chat. Ser contacto no implica permiso para compartir recuerdos.
- Estados: `pending`, `accepted`, `rejected`, `revoked`. Solo `accepted` permite leer o escribir recuerdos compartidos.
- Un usuario puede invitar; **solo el destinatario** puede aceptar o rechazar. Cualquiera de los dos puede revocar.
- Una invitación caducada o revocada no se reactiva silenciosamente; requiere una nueva solicitud.
- Bloqueo en cualquiera de las direcciones anula inmediatamente el acceso.

## Firestore (propuesta)
`conversations/{conversationId}/momentSharing/consent`:
`{inviterUid, inviteeUid, state, createdAt, respondedAt, revokedAt, generation}`.

`conversations/{conversationId}/moments/{momentId}`:
`{kind:'memory', createdBy, createdAt, title, message, mediaPath?, mediaType?}`.

Las reglas actuales de `moments` permiten crear y leer recuerdos de texto a miembros de la conversación **sin consentimiento independiente**. Antes de usar esa colección para recuerdos compartidos, reemplazar la autorización con una función que verifique estado accepted, UID, bloqueo y generación. No habilitar medios con las reglas actuales.

## Almacenamiento multimedia
- Ruta privada vinculada a conversación, generación de consentimiento y UUID aleatorio.
- Autorización en servidor para leer/escribir, validación de tipo y tamaño; no publicar enlaces permanentes.
- Tras revocación, bloquear lecturas y nuevas subidas; definir política de eliminación/retención y archivos ya descargados.
- Nunca prometer borrar archivos que un destinatario ya haya descargado.

## Criterios de aceptación
1. A invita a B; B ve solicitud; C no puede verla.
2. Antes de aceptar, ni A ni B pueden leer o crear recuerdos compartidos.
3. Solo B acepta o rechaza; A no puede autoaprobar.
4. Tras aceptar, A y B ven el mismo recuerdo en dispositivos distintos.
5. Un tercero, usuario bloqueado o participante tras revocación recibe permission-denied.
6. Los recuerdos personales locales siguen visibles después de abrir/cerrar.
7. La interfaz muestra claramente pendiente, aceptado, rechazado, revocado, sin conexión y error.
8. Pruebas automatizadas en Firebase Emulator y prueba manual con dos cuentas antes de publicar.

## Orden de trabajo
1. Escribir reglas y pruebas del emulador para consentimiento.
2. Integrar solicitud/aceptación/revocación con sesión Firebase existente.
3. Habilitar recuerdos de texto sincronizados.
4. Agregar fotos/videos con reglas de Storage verificadas.
5. Prueba en dos teléfonos y despliegue controlado.
