type NullToUndefined<T> = T extends null
  ? undefined
  : T extends readonly (infer U)[]
    ? NullToUndefined<U>[]
    : T extends object
      ? { [K in keyof T]: NullToUndefined<T[K]> }
      : T;

export function normalizeHeyApiResponse<T>(value: T): NullToUndefined<T> {
  if (value === null) {
    return undefined as NullToUndefined<T>;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeHeyApiResponse(item)) as NullToUndefined<T>;
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeHeyApiResponse(item)]),
    ) as NullToUndefined<T>;
  }
  return value as NullToUndefined<T>;
}
