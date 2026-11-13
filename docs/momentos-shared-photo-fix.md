# Corrección pendiente: fotos compartidas en KLK Momentos

## Diagnóstico confirmado
- `momentos.html` conserva fotos personales como Blob en IndexedDB, por dispositivo.
- `conversations/{id}/moments` sincroniza texto, pero las reglas no admiten metadatos multimedia.
- `storage.rules` no permite fotos de Momentos.
- No se debe copiar automáticamente la galería personal a una conversación.

## Implementación segura necesaria antes de activar el botón de fotos
1. Crear ruta privada `moments/{conversationId}/{consentGeneration}/{uuid}` con comprobación de miembros, consentimiento aceptado y bloqueo en ambas direcciones.
2. Validar MIME real, tamaño y límites; usar identificadores aleatorios.
3. Guardar solo `mediaPath`, `mediaType`, tamaño y autor en Firestore; nunca URLs públicas o tokens permanentes.
4. Descargar mediante autorización verificada en cada lectura; revocar acceso al cambiar consentimiento.
5. Probar acceso A/B, denegación C, revocación, bloqueo, subida interrumpida y errores de red en emuladores.
6. Mantener intactos los Blobs de IndexedDB; ofrecer acción explícita para compartir cada foto.
7. Probar con dos cuentas reales en versión de prueba antes de desplegar.

No activar permisos abiertos de Storage ni afirmar que las fotos están sincronizadas antes de esas pruebas.
