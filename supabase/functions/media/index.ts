import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "klk-familia";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
let SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
try {
  const secretKeys = JSON.parse(secretKeysRaw);
  SERVICE_ROLE_KEY = SERVICE_ROLE_KEY || secretKeys.default || "";
} catch {
  // Older projects may expose only the legacy service-role environment variable.
}
const BUCKET = "Chat-media";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

async function verifyFirebaseUser(request: Request): Promise<string | null> {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !PROJECT_ID) return null;

  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function verifyConversationMember(conversationId: string, token: string, uid: string): Promise<string[] | null> {
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(conversationId)) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/conversations/${encodeURIComponent(conversationId)}`;
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const document = await response.json();
    const members = document?.fields?.members?.arrayValue?.values?.map((v: any) => v.stringValue).filter((v: unknown) => typeof v === "string") ?? [];
    if (members.length !== 2 || !members.includes(uid)) return null;
    return members;
  } catch {
    return null;
  }
}

async function verifyStatusVisible(statusOwnerUid: string, token: string, requesterUid: string): Promise<boolean> {
  if (statusOwnerUid === requesterUid) return true;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(statusOwnerUid) || !/^[A-Za-z0-9_-]{1,128}$/.test(requesterUid)) return false;
  const requestIds = [`${requesterUid}__${statusOwnerUid}`, `${statusOwnerUid}__${requesterUid}`];
  for (const requestId of requestIds) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/contactRequests/${encodeURIComponent(requestId)}`;
    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) continue;
      const document = await response.json();
      if (document?.fields?.status?.stringValue === "accepted") return true;
    } catch {
      // A missing or unreadable request does not grant access.
    }
  }
  return false;
}

async function verifyPublicProfileVisible(profileUid: string, token: string, requesterUid: string): Promise<boolean> {
  if (profileUid === requesterUid) return true;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(profileUid)) return false;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/publicProfiles/${encodeURIComponent(profileUid)}`;
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return false;
    const document = await response.json();
    return document?.fields?.directoryVisible?.booleanValue === true;
  } catch {
    return false;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return reply(405, { error: "Método no permitido." });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PROJECT_ID) {
    return reply(500, { error: "Faltan secretos de configuración del servicio." });
  }

  const uid = await verifyFirebaseUser(request);
  if (!uid) return reply(401, { error: "Sesión de Firebase no válida." });
  const authHeader = request.headers.get("Authorization") ?? "";
  const firebaseToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  let body: { action?: string; type?: string; size?: number; mimeType?: string; path?: string; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return reply(400, { error: "Solicitud inválida." });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (body.action === "create-upload") {
    const type = body.type;
    const size = Number(body.size);
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase() : "";
    const isImage = type === "image" && mimeType.startsWith("image/");
    const isAudio = type === "audio" && mimeType.startsWith("audio/");
    const isFile = type === "file" && mimeType.length > 0 && mimeType.length <= 128;
    const isAvatar = type === "avatar" && mimeType.startsWith("image/");
    const isCover = type === "cover" && mimeType.startsWith("image/");
    const isStatus = type === "status" && mimeType.startsWith("image/");
    if ((!isImage && !isAudio && !isAvatar && !isCover && !isStatus && !isFile) || !Number.isSafeInteger(size) || size <= 0) {
      return reply(400, { error: "Tipo o tamaño de archivo no válido." });
    }
    if ((isImage && size > MAX_IMAGE_BYTES) || (isAudio && size > MAX_AUDIO_BYTES) || (isAvatar && size > MAX_AVATAR_BYTES) || (isCover && size > MAX_COVER_BYTES) || (isStatus && size > MAX_IMAGE_BYTES) || (isFile && size > MAX_FILE_BYTES)) {
      return reply(413, { error: "El archivo supera el límite permitido." });
    }

    const extension = mimeType === "image/jpeg" ? "jpg"
      : mimeType === "audio/mp4" ? "m4a"
      : mimeType === "audio/webm" || mimeType === "audio/webm;codecs=opus" ? "webm"
      : mimeType.split("/")[1]?.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    let path: string;
    if (isAvatar) {
      path = `avatars/${uid}/${crypto.randomUUID()}.${extension}`;
    } else if (isCover) {
      path = `covers/${uid}/${crypto.randomUUID()}.${extension}`;
    } else if (isStatus) {
      path = `statuses/${uid}/${crypto.randomUUID()}.${extension}`;
    } else if (body.conversationId) {
      const members = await verifyConversationMember(body.conversationId, firebaseToken, uid);
      if (!members) return reply(403, { error: "No perteneces a esta conversación privada." });
      path = `dm/${body.conversationId}/${uid}/${crypto.randomUUID()}.${extension}`;
    } else {
      path = `${uid}/${crypto.randomUUID()}.${extension}`;
    }
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("No se pudo crear la carga firmada:", error);
      return reply(500, { error: "No se pudo preparar la carga del archivo." });
    }
    return reply(200, { path, token: data.token, bucket: BUCKET, mimeType });
  }

  if (body.action === "create-download-url") {
    const path = typeof body.path === "string" ? body.path : "";
    if (body.conversationId) {
      const members = await verifyConversationMember(body.conversationId, firebaseToken, uid);
      if (!members || !path.startsWith(`dm/${body.conversationId}/`) ||
          !/^dm\/[A-Za-z0-9_-]{1,256}\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9-]{16,64}\.[a-z0-9]{1,8}$/i.test(path) ||
          !members.some(member => path.startsWith(`dm/${body.conversationId}/${member}/`))) {
        return reply(403, { error: "No tienes permiso para acceder a este archivo privado." });
      }
    } else if (path.startsWith("avatars/")) {
      const avatarParts = path.split("/");
      if (avatarParts.length !== 3 || !/^[A-Za-z0-9_-]{1,128}$/.test(avatarParts[1]) ||
          !/^[A-Za-z0-9-]{16,64}\.[a-z0-9]{1,8}$/i.test(avatarParts[2])) {
        return reply(403, { error: "Ruta de foto de perfil no válida." });
      }
      if (!(await verifyPublicProfileVisible(avatarParts[1], firebaseToken, uid))) {
        return reply(403, { error: "Este perfil no está visible para otros miembros." });
      }
    } else if (path.startsWith("covers/")) {
      const coverMatch = path.match(/^covers\/([A-Za-z0-9_-]{1,128})\/[A-Za-z0-9-]{16,64}\.[a-z0-9]{1,8}$/i);
      if (!coverMatch) return reply(403, { error: "Ruta de foto de portada no válida." });
      if (!(await verifyPublicProfileVisible(coverMatch[1], firebaseToken, uid))) {
        return reply(403, { error: "Este perfil no está visible para otros miembros." });
      }
    } else if (path.startsWith("statuses/")) {
      const statusMatch = path.match(/^statuses\/([A-Za-z0-9_-]{1,128})\/[A-Za-z0-9-]{16,64}\.[a-z0-9]{1,8}$/i);
      if (!statusMatch) return reply(403, { error: "Ruta de estado no válida." });
      if (!(await verifyStatusVisible(statusMatch[1], firebaseToken, uid))) {
        return reply(403, { error: "Este estado solo está disponible para los contactos del usuario." });
      }
    } else if (!/^[^/]{1,128}\/[A-Za-z0-9-]{16,64}\.[a-z0-9]{1,8}$/i.test(path)) {
      return reply(403, { error: "Ruta de archivo no válida o sin permiso." });
    }
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) {
      console.error("No se pudo crear la URL de lectura:", error);
      return reply(404, { error: "No se encontró el archivo solicitado." });
    }
    return reply(200, { signedUrl: data.signedUrl, expiresIn: 3600 });
  }

  return reply(400, { error: "Acción no reconocida." });
});
