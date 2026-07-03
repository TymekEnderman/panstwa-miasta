import { useEffect } from "react";
import { showToast } from "@/components/ui/toastStore";

export const STORAGE_KEYS = {
  categories: "panstwa-miasta.categories.v1",
  legacyGameV1: "panstwa-miasta.game.v1",
  legacyGameV2: "panstwa-miasta.game.v2",
  game: "panstwa-miasta.game.v3",
  legacySettings: "panstwa-miasta.settings.v1",
  settings: "panstwa-miasta.settings.v2",
  backup: "panstwa-miasta.backup",
} as const;

type VersionedPayload<T> = {
  version: number;
  data: T;
};

const hydrationWarnings: string[] = [];

export function pushHydrationWarning(message: string) {
  hydrationWarnings.push(message);
}

export function getHydrationWarnings() {
  return [...hydrationWarnings];
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStorageItem(key: string) {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`[storage] Nie udało się odczytać surowego klucza ${key}.`, error);
    pushHydrationWarning(`Nie udało się odczytać danych dla ${key}. Użyto danych domyślnych.`);
    return null;
  }
}

export function parseVersionedValue<T>(raw: string | null, key: string) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<VersionedPayload<T>>;
  } catch (error) {
    console.warn(`[storage] Nie udało się sparsować klucza ${key}.`, error);
    pushHydrationWarning(`Dane dla ${key} były uszkodzone. Przywrócono bezpieczny stan.`);
    return null;
  }
}

export function loadVersionedValue<T>(key: string, fallback: T, version = 1) {
  const parsed = parseVersionedValue<T>(readStorageItem(key), key);

  if (!parsed) {
    return fallback;
  }

  if (parsed.version !== version || !("data" in parsed)) {
    console.warn(`[storage] Nieobsługiwana wersja danych dla klucza ${key}.`);
    pushHydrationWarning(`Wykryto starsze lub niepełne dane dla ${key}. Przywrócono bezpieczny stan.`);
    return fallback;
  }

  return parsed.data as T;
}

export function saveVersionedValue<T>(key: string, data: T, version = 1) {
  if (!isBrowser()) {
    return;
  }

  const payload: VersionedPayload<T> = {
    version,
    data,
  };

  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearVersionedValue(key: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function backupStorageValue(key: string, rawValue: string) {
  if (!isBrowser()) {
    return;
  }

  const timestamp = new Date().toISOString();
  window.localStorage.setItem(`${STORAGE_KEYS.backup}.${key}.${timestamp}`, rawValue);
}

export function useStorageHydrationWarnings() {
  useEffect(() => {
    const warnings = getHydrationWarnings();

    warnings.forEach((warning) => {
      showToast({
        title: "Przywrócono bezpieczne dane",
        description: warning,
        tone: "warning",
      });
    });
  }, []);
}
