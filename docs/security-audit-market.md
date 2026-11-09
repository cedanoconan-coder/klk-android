# Auditoría inicial de seguridad y acceso público

Fecha: 2026-11-09
Rama: `market-readiness`

## Hallazgos y cambios realizados en `market-readiness`

### 1. Directorio de usuarios — cambio aplicado en la rama
- `loadPeople()` ahora consulta `publicProfiles` filtrando `directoryVisible == true`; ya no recorre `users`.
- `users/{uid}` solo permite lectura al propietario.
- `publicProfiles/{uid}` usa lista blanca de campos y no admite `email`.
- La persona puede activar o desactivar voluntariamente su aparición en el directorio.
- La función multimedia comprueba la visibilidad pública antes de emitir URL firmada de avatar o portada; el propietario conserva acceso a sus propios archivos.
- Pendiente: probar con dos cuentas reales y verificar el servicio Supabase desplegado. Los cambios de Edge Function siguen solo en GitHub.

### 2. Estados — mitigación parcial aplicada en la rama
- Los estados siguen siendo legibles por cualquier usuario autenticado; la audiencia todavía no está configurada.
- Los nuevos estados ya no incluyen `email` y las reglas rechazan ese campo.
- Los estados antiguos pueden conservar el correo hasta que expiren (aproximadamente 24 horas desde su publicación).
- Pendiente: decidir si los estados se muestran a todos los miembros o solo a contactos; después aplicar la misma audiencia a consultas, lecturas, visualizaciones, likes y URL de fotos.

### 3. Registro
- La interfaz y las reglas exigen un código de invitación válido para crear el perfil.
- Esto es útil para una beta cerrada, pero no es todavía un flujo de alta pública.
- Acción requerida: diseñar alta abierta con verificación de correo, protección contra abuso, límites de creación y recuperación de cuenta. No quitar el requisito hasta probar el nuevo flujo completo.

### 3. Registro
- La interfaz y las reglas exigen un código de invitación válido para crear el perfil.
- Esto es útil para una beta cerrada, pero no es todavía un flujo de alta pública.
- Acción requerida: diseñar alta abierta con verificación de correo, protección contra abuso, límites de creación y recuperación de cuenta. No quitar el requisito hasta probar el nuevo flujo completo.

### 4. Contacto de desconocidos y abuso — pendiente crítico
- No se encontraron colecciones ni reglas funcionales para bloqueo o denuncia.
- Las invitaciones pueden crearse para otro UID sin límites de frecuencia en las reglas revisadas.
- Para permitir conocer personas nuevas hacen falta controles de bloqueo, denuncia, límites de mensajes/invitaciones, prevención de spam y privacidad configurable.
- Acción requerida: implementar esos controles antes de habilitar mensajes a desconocidos a escala.

### 5. Mensajes privados
- Las reglas de `conversations/{id}/messages` comprueban que el usuario sea miembro de la conversación.
- Existe una prueba automatizada que confirma que una persona ajena no puede leer mensajes de esa conversación.
- Acción requerida: ampliar pruebas para escritura, adjuntos, borrado, recibos, llamadas, acceso cruzado y usuarios bloqueados.

### 6. Archivos multimedia
- La Edge Function valida el token de Firebase y exige pertenencia a la conversación para archivos `dm/`.
- En `market-readiness`, las URLs firmadas de avatar y portada ahora consultan el perfil público y respetan `directoryVisible`; el propietario puede acceder a sus propios medios.
- Los estados siguen permitiendo descarga a cualquier usuario autenticado, en coherencia con la regla actual de lectura global.
- Pendiente: ejecutar pruebas específicas de la Edge Function y confirmar que la versión desplegada en Supabase coincide con el código de esta rama.

## Orden recomendado de implementación
1. Completar pruebas de reglas y del flujo de perfiles públicos con dos cuentas.
2. Decidir y aplicar la audiencia de estados; comprobar likes, vistas y fotos.
3. Implementar bloqueo, denuncia y límites anti-spam.
4. Probar la Edge Function multimedia en staging y verificar su despliegue.
5. Crear registro público protegido y probarlo en staging.
6. Hacer pruebas de carga, monitoreo y revisión de costos.

## No publicar todavía
No desplegar reglas nuevas ni abrir el registro público basándose solo en esta auditoría. Los cambios deben tener pruebas automatizadas aprobadas y verificación con dos o más cuentas antes de producción.
