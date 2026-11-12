/**
 * Valida rutas heredadas de archivos privados guardados como:
 *   <firebase-uid>/<uuid>.<extension>
 *
 * No concede acceso a rutas de otros usuarios ni a rutas anidadas.
 */
export function isOwnedLegacyMediaPath(path, uid) {
  if (typeof path !== "string" || typeof uid !== "string" || !uid || uid.length > 128) {
    return false;
  }

  const match = path.match(/^([^/]{1,128})\/([A-Za-z0-9-]{16,64})\.([a-z0-9]{1,8})$/i);
  return Boolean(match && match[1] === uid);
}

/**
 * Solo acepta imágenes de estados bajo el UID declarado en el estado.
 */
export function isStatusMediaPathForOwner(path, ownerUid) {
  if (typeof path !== "string" || typeof ownerUid !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(ownerUid)) return false;
  return new RegExp("^statuses/" + ownerUid + "/[A-Za-z0-9-]{16,64}\\.[a-z0-9]{1,8}$", "i").test(path);
}
