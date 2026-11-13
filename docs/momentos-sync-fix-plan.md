# Corrección KLK Momentos: sincronización segura

## Diagnóstico confirmado
- `momentos.html` guarda fotos y videos personales en IndexedDB: no se sincronizan.
- Los recuerdos escritos de `conversations/{id}/moments` usan `onSnapshot` y pueden sincronizarse.
- La selección de contacto consulta el consentimiento solo una vez (`get()`); una aceptación en el segundo teléfono no se refleja en el primero hasta volver a seleccionar el contacto.
- El documento de consentimiento advierte que las reglas de recuerdos aún no exigen consentimiento aceptado.

## Implementación requerida antes de publicar
1. Suscribir en tiempo real el documento `momentSharing/consent` y cancelar el listener al cambiar de contacto o cerrar sesión.
2. Verificar que la conversación tenga exactamente dos participantes autenticados y que solo el invitado acepte; ambos pueden revocar.
3. Reforzar las reglas de `moments`: lectura y creación solo con consentimiento `accepted`, participantes válidos y sin bloqueo. Prohibir cambios de autor, generación y rutas multimedia.
4. Probar en Firebase Emulator: pendiente, aceptación, rechazo, revocación, terceros, bloqueo y escritura fraudulenta.
5. Incorporar almacenamiento multimedia privado (sin enlaces públicos permanentes), con controles de acceso en servidor, límites de tamaño/tipo y revocación. No subir automáticamente recuerdos locales.
6. Probar con dos cuentas reales y desplegar solamente después de pasar todas las pruebas.

## Precaución
No cambiar la galería personal ni borrar IndexedDB. No publicar fotos/videos compartidos usando las reglas actuales.
