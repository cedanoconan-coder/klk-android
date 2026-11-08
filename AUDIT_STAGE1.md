# Auditoría inicial de klk — Etapa 1

Fecha: 2026-11-08
Rama de trabajo: feature/whatsapp-complete-parity-2026-11-08
Base inspeccionada: main

## Resultado

Se realizó una inspección estática del código del repositorio. No se ejecutó la aplicación en dos teléfonos ni se hicieron pruebas autenticadas contra Firebase/Supabase; por tanto, este informe no certifica el funcionamiento en producción.

## Funciones que ya aparecen en el código

- Inicio de sesión y registro mediante Firebase Authentication.
- Conversaciones privadas bajo `conversations/{conversationId}/messages`.
- Envío de texto y adjuntos de imagen, audio y archivo mediante la capa de almacenamiento.
- Perfil propio, foto de perfil y panel de perfil de otros contactos.
- Vista de contenido compartido del contacto, con pestañas multimedia.
- Solicitudes y aceptación de contactos.
- Módulo de llamadas WebRTC de voz/vídeo con diagnóstico de permisos y conectividad.
- Ajustes de apariencia y navegación; paneles de llamadas, novedades, herramientas y asistente.

La presencia de código/interfaz no demuestra que cada flujo esté probado o disponible para todos los usuarios.

## Hallazgos prioritarios

### P0 — Mensajes y reglas de Firestore

Las reglas actuales permiten crear mensajes con tipos `text`, `image`, `audio` y `file`, pero limitan las claves del documento y deniegan explícitamente `update` y `delete`. Esto impide implementar de forma segura sobre el modelo actual funciones como editar, borrar, reaccionar, marcar leído/entregado o añadir respuestas sin diseñar primero un esquema y reglas específicas.

### P0 — Privacidad

Las reglas de lectura de mensajes dependen de `isConversationMember(conversationId)`. Antes de añadir funciones sociales o grupales hay que validar las reglas auxiliares y comprobar accesos negativos con dos cuentas que no sean miembros. No ampliar permisos globales.

### P1 — Experiencia de chat

No se encontraron identificadores/campos obvios en el HTML/JS inspeccionado para edición, eliminación, reacciones, reenvío, respuesta/cita, confirmaciones de lectura/entrega ni indicador de escritura. Se deben diseñar como un conjunto coherente (datos, interfaz y reglas), no como botones aislados.

### P1 — Archivos

La interfaz contiene controles para foto, cámara, audio y documentos. Deben probarse límites, tipos MIME, errores de subida, URL firmadas, autorización por conversación, descarga y eliminación/retención de archivos.

### P1 — Perfil y archivos compartidos

Ya existe una vista de perfil de contacto con acciones de mensaje, voz, vídeo, compartir foto y documento, y una consulta de contenido compartido. Se debe verificar que todas las categorías de archivos se registren y se muestren correctamente, y que las URL no permitan acceder a archivos de conversaciones ajenas.

### P1 — Llamadas

Existe un módulo WebRTC con oferta/respuesta, candidatos, permisos y diagnóstico STUN/TURN. El propio diagnóstico contempla que TURN puede no estar configurado. Se requiere prueba real en dos teléfonos, con Wi-Fi y datos móviles, pantalla bloqueada, permisos denegados y reconexión. No declarar llamadas fiables en segundo plano sin notificaciones/push y pruebas de plataforma.

### P2 — Novedades

La pantalla de Novedades todavía muestra un mensaje de “Próximamente”; los estados de 24 horas, audiencia y visualizaciones no están implementados en el flujo inspeccionado.

## Próxima implementación recomendada

1. Diseñar el modelo de mensajes con campos opcionales validados: `editedAt`, `deletedAt`, `replyTo`, `forwardedFrom`, `reactions`, `deliveredAt` y `readAt` (o subcolecciones para evitar escrituras concurrentes).
2. Definir reglas de Firestore que permitan únicamente cambios autorizados por el autor o por el destinatario, con listas exactas de campos modificables y límites de tamaño/tipo.
3. Implementar respuestas y reacciones en la interfaz y probar con dos cuentas.
4. Añadir confirmaciones de entrega/lectura y escritura/presencia con reglas que no permitan suplantación.
5. Añadir edición/eliminación y reenvío, con estados visibles y pruebas de seguridad.
6. Validar adjuntos y perfil compartido en dos dispositivos.

## Decisión de seguridad

No se cambiaron las reglas de producción ni se publicó una nueva versión. No se añadieron permisos abiertos ni se alteraron secretos. Los cambios funcionales deben revisarse y probarse antes de fusionarlos en `main`.
