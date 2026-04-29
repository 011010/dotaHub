import '@testing-library/jest-dom'

// Full localStorage mock (jsdom's implementation omits .clear() in some versions)
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:    (key: string) => store[key] ?? null,
    setItem:    (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear:      () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value:    localStorageMock,
  writable: true,
})
