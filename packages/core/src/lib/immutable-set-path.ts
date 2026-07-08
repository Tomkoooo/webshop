/**
 * Immutable assign by dotted path. Supports numeric segments for arrays (e.g. highlights.0.title).
 */
export function setAtPath<T>(root: T, path: string, value: unknown): T {
  const parts = path.split(".").filter(Boolean)
  if (parts.length === 0) return root

  function walk(node: unknown, depth: number): unknown {
    if (depth >= parts.length) return value
    const key = parts[depth]
    const isIndex = /^\d+$/.test(key)
    const idx = isIndex ? parseInt(key, 10) : key

    if (isIndex) {
      const arr = Array.isArray(node) ? [...node] : []
      while (arr.length <= (idx as number)) {
        arr.push(undefined)
      }
      arr[idx as number] = walk(arr[idx as number], depth + 1)
      return arr
    }

    const obj =
      node && typeof node === "object" && !Array.isArray(node)
        ? { ...(node as Record<string, unknown>) }
        : ({} as Record<string, unknown>)
    obj[key as string] = walk(obj[key as string], depth + 1)
    return obj
  }

  return walk(root, 0) as T
}
