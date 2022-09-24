export type BareFunction = (...args: any[]) => any;
export type Transform<I, O> = (args: I) => O;
export type Remap<T> = (args: T) => T;
export type IdentityFn = { <T>(x:T):T };

export function identity<T>(t: T): T { return t; }

export function drop() { return undefined; }
