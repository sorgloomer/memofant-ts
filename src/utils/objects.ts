export const hasOwn: (obj: object, v: PropertyKey) => boolean
  = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

export function getOwn<O extends object, K extends keyof O>(obj: O, v: K): O[K] | undefined {
  return hasOwn(obj, v) ? obj[v] : undefined;
}
