import '@testing-library/jest-dom/vitest'

// Polyfill localStorage for jsdom environments that may not provide it
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() { return store.size },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
    writable: true,
  })
}
