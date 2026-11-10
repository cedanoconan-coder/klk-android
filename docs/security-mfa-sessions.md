# MFA TOTP y revocación de sesiones en klk

## Qué añade este cambio
- Inicio de sesión con el SDK modular de Firebase para resolver desafíos TOTP.
- Inscripción y baja de TOTP desde Perfil → Seguridad. Firebase exige correo verificado y reautenticación.
- Cloud Function `revokeAllSessions`: verifica el ID token, registra una marca de revocación en Firestore y llama a `revokeRefreshTokens` con Firebase Admin.
- Las reglas de Firestore consultan `sessionRevocations/{uid}` mediante `signedIn()`. Los ID tokens cuya marca `auth_time` sea anterior o igual a `revokedAt` pierden acceso inmediatamente a los documentos protegidos por estas reglas.
- La revocación afecta a **todos los dispositivos de la cuenta**, incluido el actual; no es un selector de sesiones individuales.

## Requisitos previos en Firebase
1. El proyecto `klk-familia` debe estar actualizado a **Firebase Authentication with Identity Platform** y tener habilitado correo/contraseña.
2. La cuenta administradora necesita el rol IAM `roles/identitytoolkit.admin`.
3. Desde `functions`, instala dependencias con `npm install`.
4. Autentícate con Google Application Default Credentials para el proyecto correcto.
5. Ejecuta `npm run enable:totp`. El script conserva factores multifactor existentes y añade TOTP; no contiene claves ni credenciales.
6. Verifica los dominios autorizados y prueba inscripción, desafío TOTP y recuperación de acceso.

## Despliegue del backend (pendiente)
Cuando se apruebe el despliegue, desde la raíz:
```bash
firebase deploy --only functions:revokeAllSessions --project klk-familia
```
Cloud Functions puede requerir plan Blaze y habilitar Cloud Functions, Cloud Build y Artifact Registry. Revisa cualquier coste antes de activar el plan.

## Pruebas
- `npm test --prefix functions`: prueba la comparación de `auth_time` y la marca de revocación.
- `npm run test:rules`: prueba que Firestore rechaza sesiones antiguas y permite autenticaciones posteriores.

## Límites importantes
- La revocación invalida de inmediato el acceso a Firestore protegido por estas reglas y evita renovar sesiones antiguas.
- Los enlaces firmados de archivos ya emitidos siguen utilizables hasta su vencimiento.
- Los endpoints actuales de Supabase Storage/AI/Push deben aplicar también la comprobación de `sessionRevocations` antes de considerarse totalmente integrados; no se despliegan ni sustituyen desde este PR.
- MFA se ofrece para inscripción voluntaria; no se fuerza automáticamente a toda la familia.
- Este PR no publica la función, no cambia Firebase y no ejecuta el script de activación TOTP.
