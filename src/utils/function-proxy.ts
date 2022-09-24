import { BareFunction } from "../utils/functions";
import { Invocation } from "node-memoizer/Invocation";
import { SymbolicWeakMap } from "utils/SymbolicWeakMap";


const metas = new SymbolicWeakMap<ProxyFnMeta<any>>('proxy_meta');


export function prepareProxyFn<T extends BareFunction, O extends T>(
  original: O,
  proxy: T,
): O {
  Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(original));
  const meta = { original };
  metas.set(proxy, meta);
  return proxy as O;
}

export type ProxyFnMeta<T> = { original: T };

export function makeProxyFn<T extends BareFunction>(
  fn: T,
  cb: (invocation: Invocation<T>) => ReturnType<T>,
): T {
  const proxy = function _functionProxy(
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): ReturnType<T> {
    return cb(new Invocation(fn, args, this));
  } as T;

  return prepareProxyFn<T, T>(fn, proxy);
}

export function getProxyFnMeta<T>(fn: T): ProxyFnMeta<T> | undefined {
  return metas.get(fn);
}
