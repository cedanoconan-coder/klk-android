# KLK Estados Inteligentes — plan de integración

Estado: propuesta técnica, **no implementado**.

## Objetivo
Integrar cámara, seguimiento facial, efectos, edición y León IA dentro de la pestaña Novedades > Estados, sin reintroducir KLK Clips ni el laboratorio como secciones independientes.

## Arquitectura prevista
- `status-camera`: vista a pantalla completa, permisos de cámara, cambio de lente, captura de foto/video, gestión de orientación y safe areas.
- `face-tracking`: landmarks de cara, ojos, boca, mejillas y mandíbula; suavizado temporal; reenganche tras oclusión; calibración por distancia y giro; ejecución local cuando sea posible.
- `status-effects`: registro modular de filtros (barba, iris, cabello, piel, color); máscaras que excluyan labios y párpados; seguimiento persistente y adaptación geométrica, no superposición fija.
- `status-editor`: vista previa no destructiva, recorte, rotación, texto, stickers, música con derechos adecuados, deshacer y exportación.
- `leon-assistant`: sugerencias opcionales de efectos y ajustes; consentimiento explícito antes de procesar fotos en servicios externos; degradación elegante sin IA remota.
- `status-publisher`: reutilizar el flujo existente de compresión, subida y publicación, evitando dobles subidas.

## Reglas de integración
1. Identificar primero los puntos de entrada y archivos actuales de Estados, cámara y publicación.
2. No cambiar las reglas de Firestore ni las rutas de almacenamiento sin revisión y pruebas.
3. No almacenar fotogramas biométricos ni landmarks por defecto.
4. Limitar resolución y FPS de inferencia según capacidad del dispositivo; liberar cámara, streams, modelos y timers al cerrar.
5. Mantener controles accesibles, diseño responsive y compatibilidad web/Android.
6. El editor y la cámara deben funcionar aunque León IA no esté disponible.
7. Activar por bandera de función, con retorno al editor anterior.

## Entregas
- Fase A: auditoría de los módulos reales y pruebas de regresión.
- Fase B: interfaz de cámara a pantalla completa y navegación de efectos.
- Fase C: tracking estable, máscara de barba que cubra mandíbula sin invadir labios, iris delimitado por párpados y efectos de piel.
- Fase D: editor multimedia integrado y vista previa.
- Fase E: León IA opcional, optimización y pruebas en APK y web.

## Criterios de aceptación
- Barba adherida a mandíbula, mejillas y mentón durante giros y movimiento; labios libres.
- Iris permanece dentro del ojo durante parpadeos y giros.
- Cambio de efecto sin congelamiento ni fugas de cámara.
- Captura, edición, vista previa, publicación y visualización siguen funcionando.
- Sin aumento descontrolado del consumo de Supabase; compresión y límites de subida verificados.
- Pruebas manuales en dos Android y en web, más CI antes de fusionar.

## Pendiente antes de escribir código funcional
Inspeccionar el árbol actual, los módulos de Estados, dependencias de seguimiento facial y las rutas de subida. Este documento solo prepara el trabajo.
