/** Convert Mongoose lean docs / ObjectIds to JSON-safe plain data for RSC → client props. */
export function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
