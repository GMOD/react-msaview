// typescript error https://github.com/typescript-eslint/typescript-eslint/issues/2446 if this version is used, maybe due to outdated tsdx dependencies
// export function transform<T>(
//   obj: Record<string, T>,
//   cb: (arg0: [string, T]) => [string, T],
// ) {
//   return Object.fromEntries(Object.entries(obj).map(cb));
// }

export function transform(obj, cb) {
  return Object.fromEntries(Object.entries(obj).map(cb));
}
