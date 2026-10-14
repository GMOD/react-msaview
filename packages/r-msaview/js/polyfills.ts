// QuickJS has neither; the model asks crypto for element ids and clones layer
// records
const g = globalThis as Record<string, unknown>

g.crypto ??= {
  getRandomValues<T extends ArrayBufferView>(array: T) {
    const bytes = new Uint8Array(
      array.buffer,
      array.byteOffset,
      array.byteLength,
    )
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    return array
  },
  randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.floor(Math.random() * 16)
      return (c === 'x' ? r : (r % 4) + 8).toString(16)
    })
  },
}

g.structuredClone ??= (value: unknown) => JSON.parse(JSON.stringify(value))
