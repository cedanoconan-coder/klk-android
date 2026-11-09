# Auditoría inicial de seguridad y acceso público

Fecha: 2026-11-09
Rama: `market-readiness`

## Riesgos confirmados en el código actual

### 1. Directorio de usuarios
- `loadPeople()` consulta toda la colección `users` con un listener en tiempo real.
- Las reglas actuales permiten `read` a cualquier usuario autenticado sobre `users/{userId}`.
- Los documentos contienen `email`, y también datos de perfil como nombre y rutas de imágenes.
- Firestore Rules no permite ocultar campos individuales dentro de un documento: restringir lectura exige separar datos privados y públicos en documentos/colecciones distintos.
- Acción requerida: mover el directorio a `publicProfiles` con lista blanca de campos; dejar `users/{uid}` legible solo por su propietario y migrar la interfaz por etapas.

### 2. Estados
- Las reglas actuales permiten leer `statuses` a cualquier usuario autenticado.
- Los estados guardan correo electrónico junto al nombre y contenido.
- Acción requerida: quitar el correo de los documentos de estado, definir audiencia (público/seguidores/contactos/privado), aplicar consentimiento y revisar lecturas y vistas antes de habilitar descubrimiento global.

### 3. Registro
- La interfaz y las reglas exigen un código de invitación válido para crear el perfil.
- Esto es útil para una beta cerrada, pero no es todavía un flujo de alta pública.
- Acción requerida: diseñar alta abierta con verificación de correo, protección contra abuso, límites de creación y recuperación de cuenta. No quitar el requisito hasta probar el nuevo flujo completo.

### 4. Contacto de desconocidos y abuso
- La aplicación actual se diseñó alrededor de invitaciones/solicitudes y conversaciones de dos participantes.
- Para permitir conocer personas nuevas hacen falta controles de bloqueo, denuncia, límites de mensajes/invitaciones, prevención de spam y privacidad configurable.
- Acción requerida: implementar esos controles antes de habilitar mensajes a desconocidos a escala.

### 5. Mensajes privados
- Las reglas de `conversations/{id}/messages` comprueban que el usuario sea miembro de la conversación.
- Existe una prueba automatizada que confirma que una persona ajena no puede leer mensajes de esa conversación.
- Acción requerida: ampliar pruebas para escritura, adjuntos, borrado, recibos, llamadas, acceso cruzado y usuarios bloqueados.

### 6. Archivos multimedia
- El proyecto documenta Supabase Storage privado y una Edge Function que valida tokens de Firebase.
- La función revisada permite solicitar URL firmada para rutas de avatar, portada y estado con validación de formato de ruta; falta verificar la política de visibilidad deseada y el despliegue real del servicio.
- Acción requerida: probar que un usuario no autorizado no puede descargar adjuntos privados ni acceder a medios fuera de la audiencia permitida.

## Orden recomendado de implementación
1. Crear perfil público separado del perfil privado y actualizar reglas y pruebas.
2. Retirar correos electrónicos de documentos que se consultan como directorio o estado.
3. Añadir preferencias de visibilidad y exclusión del directorio.
4. Añadir bloqueo, denuncia y límites anti-spam.
5. Crear registro público protegido y probarlo en staging.
6. Hacer pruebas de carga, monitoreo y revisión de costos.

## No publicar todavía
No desplegar reglas nuevas ni abrir el registro público basándose solo en esta auditoría. Los cambios deben tener pruebas automatizadas aprobadas y verificación con dos o más cuentas antes de producción.
