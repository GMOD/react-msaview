export function transform<T>(
  obj: Record<string, T>,
  cb: (arg0: [string, T]) => [string, T]
) {
  return Object.fromEntries(Object.entries(obj).map(cb));
}
