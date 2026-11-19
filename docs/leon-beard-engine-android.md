# León Beard Engine — Android balanced profile

Estado: experimental. No declarar fotorrealismo ni 30 FPS sin mediciones reales.

## Pipeline actual
1. MediaPipe Face Landmarker proporciona landmarks x/y/z en el teléfono.
2. El renderizador WebGL2 interpola raíces de fibras dentro de tiras triangulares.
3. Las fibras usan muestras deterministas por triángulo para evitar cambios aleatorios entre cuadros.
4. La máscara de boca excluye los labios. La visibilidad de cada mejilla disminuye según el giro.
5. El presupuesto de renderizado ajusta la cantidad de fibras cuando el coste de CPU por cuadro es alto.

## Limitaciones actuales
- La malla usa profundidad relativa de landmarks, no una reconstrucción facial calibrada.
- No hay iluminación física del pelo, sombras de contacto, ni textura de fibras escaneadas.
- Los índices de las tiras intermedias necesitan validación anatómica con imágenes y video reales.
- El tiempo medido es CPU de generación/envío, no GPU. No equivale a FPS reales.
- El motor requiere WebGL2; todavía necesita fallback seguro si falla.
- El efecto se ve en la vista previa; comprobar por separado que se conserve en foto/video exportado.

## Criterios de aceptación antes de activar en producción
- Probar en Android real de frente, ±45° y ±70°, cabeceo, sonrisa y movimiento rápido.
- Ninguna línea negra suelta en nariz, labios o mejillas; sin triángulos cruzados.
- Pelo distribuido en mejillas, mandíbula y mentón con aspecto natural.
- Medir FPS y temperatura durante 3 minutos en un teléfono de gama media.
- Validar cámara espejada/no espejada y pausa/reanudación.
- Probar pérdida de tracking, permisos, cámara cerrada y WebGL context loss.
- Mantener un mecanismo de desactivación y comparar capturas antes/después.

## Próximas fases técnicas
- Sustituir las tiras por topología validada con máscara de folículos en coordenadas UV.
- Incorporar materiales anisotrópicos y luz estimada desde la imagen local.
- Implementar oclusión real con malla de profundidad y suavizado temporal de pose.
- Añadir pruebas automáticas de geometría, pruebas visuales y perfilado Android.
