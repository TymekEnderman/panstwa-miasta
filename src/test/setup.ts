import "@testing-library/jest-dom";

function createMockStorage() {
  const storage = new Map<string, string>();

  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    },
  };
}

if (!("localStorage" in globalThis) || !globalThis.localStorage) {
  const mockStorage = createMockStorage();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: mockStorage,
  });
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: mockStorage,
  });
}
