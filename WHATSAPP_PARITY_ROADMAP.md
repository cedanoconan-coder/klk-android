# Plan de funcionalidades completas para klk

Objetivo: construir en klk una experiencia de mensajería con las capacidades principales de WhatsApp, usando implementación propia, diseño e identidad klk. No se copiará código, marca ni recursos privados de WhatsApp.

## Base técnica identificada

- Aplicación web instalable (PWA) con Capacitor para Android.
- Firebase Authentication para cuentas.
- Cloud Firestore para conversaciones y datos en tiempo real.
- Supabase Storage previsto para fotos y notas de voz.
- El repositorio ya contiene interfaz de chats, solicitudes/personas, perfil/foto, ajustes visuales, controles multimedia y un módulo WebRTC de llamadas.
- La existencia del código no significa que cada función esté validada en dos dispositivos; cada módulo debe pasar pruebas reales.

## Inventario objetivo

### 1. Mensajería individual
- Mensajes de texto, emojis, fotos, vídeos, documentos y notas de voz.
- Grabación, reproducción, pausa y velocidad de audio.
- Responder/citar, reenviar, editar y eliminar mensajes.
- Reacciones, respuestas con menciones, copiar y compartir.
- Estados de envío, entrega y lectura; indicador de escritura y presencia.
- Fijar y destacar mensajes; búsqueda dentro de chats.
- Mensajes temporales y controles de descarga automática.
- Compartir ubicación puntual y ubicación en tiempo real, con permiso explícito.

### 2. Grupos y comunidades
- Crear grupos, imagen, descripción y enlace/código de invitación.
- Administradores, permisos, aprobación de miembros y expulsión.
- Menciones, respuestas, archivos y llamadas grupales.
- Encuestas, eventos y mensajes fijados.
- Comunidades y subgrupos, con controles de anuncios.

### 3. Novedades/Estados
- Publicar fotos, vídeos y texto con caducidad de 24 horas.
- Audiencia configurable (contactos, excepciones y compartir solo con).
- Ver lista de visualizaciones, responder y reaccionar.
- Silenciar/ocultar novedades y controles de privacidad.

### 4. Llamadas
- Llamadas de voz y vídeo individuales y grupales.
- Pantalla entrante, tonos, vibración, silenciar, cámara, altavoz y cambiar cámara.
- Historial, llamadas perdidas, reconexión y manejo de permisos.
- Notificaciones entrantes fiables en segundo plano y pruebas con redes distintas.
- Compartir pantalla solo cuando la plataforma lo permita.

### 5. Perfil, contactos y privacidad
- Perfil propio y de otros: foto, nombre, información y disponibilidad.
- Panel de perfil con accesos a archivos, enlaces, fotos y documentos compartidos.
- Bloquear/reportar, controlar quién ve foto, información, última conexión y estados.
- Gestión de contactos, solicitudes, invitaciones y dispositivos vinculados.

### 6. Configuración y seguridad
- Temas, fondos, tamaño de texto, densidad, idioma y accesibilidad.
- Tonos por tipo de aviso y por conversación; vibración y previsualizaciones.
- Copias de seguridad/restauración y administración de almacenamiento.
- Verificación en dos pasos y gestión de sesiones.
- Cifrado en tránsito y diseño de cifrado de extremo a extremo con protocolo auditado; no declarar E2E hasta implementarlo y probarlo.
- Reglas de Firestore/Storage con mínimo privilegio y pruebas de acceso entre cuentas.

### 7. Canales y funciones ampliadas
- Canales de difusión, seguir/dejar de seguir y notificaciones.
- Herramientas de administración y moderación.
- Funciones empresariales solo en una fase separada, si se solicitan.

## Orden de ejecución

1. **Auditoría y estabilidad:** verificar autenticación, permisos, privacidad, conversaciones privadas, multimedia y llamadas actuales; corregir errores antes de ampliar.
2. **Mensajería completa:** recibos, escritura/presencia, respuestas, reacciones, edición/eliminación, reenvío, búsqueda y adjuntos.
3. **Grupos:** administración, invitaciones, encuestas y eventos.
4. **Estados/Novedades:** publicación, caducidad, audiencia y visualizaciones.
5. **Llamadas robustas:** audio/vídeo grupal, notificaciones y reconexión.
6. **Perfil y privacidad:** paneles completos, archivos compartidos, bloqueo y controles.
7. **Configuración, copias y seguridad:** preferencias, sonidos, sesiones y cifrado auditado.
8. **Canales/comunidades y publicación Android:** pruebas integrales, APK y despliegue.

## Criterios de aceptación

- Cada función debe persistir y sincronizarse entre dos o más teléfonos.
- Probar cuentas distintas, permisos permitidos/denegados, desconexión y reconexión.
- No mostrar como disponible una función que solo tenga un botón o una pantalla sin backend.
- No publicar reglas abiertas ni secretos en el cliente.
- No publicar APK como versión estable hasta pasar pruebas funcionales y de seguridad.

## Restricciones conocidas

- Mantener Firebase Authentication/Firestore y usar Supabase Storage para archivos, según la decisión previa del proyecto.
- No introducir facturación de Firebase Blaze como requisito sin aprobación expresa.
- Las llamadas y la mensajería deben probarse realmente entre los dos teléfonos disponibles.
