export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `pm-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
