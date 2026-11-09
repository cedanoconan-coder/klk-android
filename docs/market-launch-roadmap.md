# klk — Preparación para el mercado

## Visión
klk será una plataforma de comunicación global: mensajería privada, descubrimiento voluntario de personas, estados, comunidades y llamadas. La prioridad es confianza, privacidad, estabilidad y crecimiento sostenible.

## Principios de lanzamiento
- La mensajería y los perfiles privados deben permanecer privados por defecto.
- El descubrimiento de personas será voluntario y mostrará solo información pública elegida por cada usuario.
- No publicar correos electrónicos, números, ubicaciones ni contenido privado en directorios públicos.
- No abrir el registro masivo hasta validar autenticación, invitaciones/registro, reglas, almacenamiento, límites de abuso y recuperación de cuentas.
- Medir capacidad y costos con pruebas; no prometer un máximo de usuarios sin pruebas de carga y revisión de cuotas.

## Hallazgos iniciales del repositorio
- La app usa Firebase Authentication y Cloud Firestore; Supabase Storage aparece en la documentación como almacenamiento de medios.
- El alta actual exige un código de invitación; no es todavía un registro público abierto.
- Las reglas actuales permiten a cualquier usuario autenticado leer documentos de `users` y `statuses`. Esos documentos incluyen campos como correo electrónico y nombre, por lo que no se debe activar descubrimiento mundial hasta separar el perfil público de los datos privados y revisar las consultas de la interfaz.
- Las reglas de mensajes individuales sí comprueban pertenencia a la conversación, lo cual es una base útil, pero debe probarse con cuentas distintas.
- La documentación del repositorio todavía marca como pendientes varias comprobaciones de configuración de Firebase y Supabase. El estado real de los servicios debe verificarse en sus consolas y con pruebas.

## Fases de trabajo
1. **Auditoría y seguridad:** mapear colecciones, permisos, almacenamiento, registro, sesiones y datos personales; añadir pruebas de reglas positivas y negativas.
2. **Identidad y descubrimiento:** separar perfil público mínimo de datos privados; permitir que cada usuario active/desactive aparecer en búsquedas y controle qué campos muestra.
3. **Mensajería global:** definir solicitudes/consentimiento, bloqueo, denuncia, límites anti-spam y controles de privacidad antes de permitir contacto entre desconocidos.
4. **Escalabilidad y operación:** revisar índices, paginación, listeners, cuotas, copias de seguridad, monitoreo, costos y pruebas de carga.
5. **Calidad y lanzamiento:** pruebas en Android y web, accesibilidad, recuperación de cuenta, política de privacidad, términos, soporte y publicación en tiendas.
6. **Crecimiento y monetización:** empezar gratis; evaluar premium y otras fuentes de ingresos solo después de lograr uso y retención saludables.

## Criterios para abrir al público
- Reglas y pruebas de seguridad aprobadas.
- Ningún dato privado expuesto en perfiles, directorios, estados o medios.
- Registro y recuperación de cuenta probados.
- Bloqueo y denuncia operativos antes de descubrimiento abierto.
- Pruebas de mensajería, medios y notificaciones con múltiples cuentas y dispositivos.
- Cuotas y costos monitorizados; límites y alertas configurados.
- Avisos legales y soporte publicados.

## Estado
Este documento inicia la línea de trabajo comercial. No modifica todavía permisos ni habilita registro público. Los cambios de seguridad se implementarán y probarán antes de publicarlos.
