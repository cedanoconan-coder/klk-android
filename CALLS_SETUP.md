# Llamadas de voz y videollamadas en klk

## Qué incluye esta implementación

- Llamadas privadas de voz y video entre contactos aceptados.
- Señalización WebRTC mediante documentos Firestore `calls`.
- Intercambio de candidatos ICE en subcolecciones privadas del documento de llamada.
- Pantalla de llamada entrante con responder/rechazar.
- Controles para silenciar el micrófono, apagar la cámara y finalizar.
- Cámara frontal para videollamadas.
- Limpieza de cámara, micrófono y listeners al terminar.

## Requisitos de despliegue

1. Publicar las reglas de `firestore.rules` en Firebase Console > Firestore Database > Rules. Sin estas reglas las llamadas no podrán señalizarse.
2. Publicar la nueva versión web de klk en GitHub Pages (al integrar esta rama en `main`).
3. Abrir klk mediante HTTPS y conceder permisos de cámara y micrófono a Chrome/la aplicación.
4. Probar con dos cuentas distintas, en dos teléfonos y con contactos aceptados.

## STUN y TURN

La configuración inicial incluye servidores públicos STUN de Google. Esto puede permitir conexiones directas, pero no garantiza llamadas entre todas las redes móviles, Wi-Fi o configuraciones NAT.

Para mejorar la conectividad se puede configurar un servidor TURN propio o un proveedor TURN de confianza. Antes de cargar `calls.js`, define:

```html
<script>
window.KLK_TURN_SERVERS = [{
  urls: ["turn:TU_SERVIDOR:3478"],
  username: "USUARIO_TEMPORAL",
  credential: "CREDENCIAL_TEMPORAL"
}];
</script>
<script src="./calls.js"></script>
```

No guardes credenciales permanentes de TURN en un repositorio público. Usa credenciales temporales generadas por un servicio backend.

## Pruebas pendientes antes de considerar la función terminada

- Llamada de voz iniciada desde el teléfono A y recibida en el B.
- Llamada de video en ambos sentidos y visualización de las dos cámaras.
- Rechazo, finalizar desde cualquiera de los teléfonos y permisos denegados.
- Repetir con datos móviles y Wi-Fi; si una red no conecta, configurar TURN y volver a probar.

La existencia del código no equivale a una llamada ya probada. Esta rama debe desplegarse y validarse en dos teléfonos antes de marcar las llamadas como listas.
