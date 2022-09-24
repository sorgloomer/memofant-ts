import { AnyFunction } from "../utils/functions";
import { Invocation } from "node-memoizer/invocation";
import { SymbolicWeakMap } from "utils/SymbolicWeakMap";


const metas = new SymbolicWeakMap<object, ProxyFnMeta<any>>('proxy_meta');


export function impersonateFn<T extends AnyFunction, O extends T>(
  original: O,
  proxy: T,
): O {
  Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(original));
  const meta = { original };
  metas.set(proxy, meta);
  return proxy as O;
}

export type ProxyFnMeta<T> = { original: T };

export function makeProxyFn<F extends AnyFunction>(
  fn: F,
  cb: (invocation: Invocation<F>) => ReturnType<F>,
): F {
  const proxy = function _functionProxy(
    this: ThisParameterType<F>,
    ...args: Parameters<F>
  ): ReturnType<F> {
    return cb(new Invocation<F>(fn, args, this));
  } as F;

  return impersonateFn<F, F>(fn, proxy);
}

export function getProxyFnMeta<T extends object>(fn: T): ProxyFnMeta<T> | undefined {
  return metas.get(fn);
}
