"use strict";
function isAuthTimeAfterRevocation(authTime, revokedAt) {
  if (!Number.isSafeInteger(authTime) || authTime < 0) return false;
  if (revokedAt === null || revokedAt === undefined) return true;
  const threshold = Number(revokedAt);
  return Number.isSafeInteger(threshold) && authTime > threshold;
}
module.exports = { isAuthTimeAfterRevocation };
