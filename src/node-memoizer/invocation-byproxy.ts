import { isPrimitive } from "utils/types";
import * as I from "./invocation";


export function byProxy<T>(x: T): InvocationRecorder<T> {
  return new Proxy(x, HANDLER);
}
export type InvocationRecorder<X> = RecorderFn<X> & RecorderObj<X>;

type RecorderFn<X> = X extends (this: infer T, ...args: infer A extends any[]) => infer R
  ? (this: T, ...args: A) => I.Invocation<X> : unknown;
type RecorderObj<X> = { [K in keyof X]: InvocationRecorder<X[K]> };

const PROXY_TARGET = Symbol("PROXY_TARGET");
function unproxy(x: any): any {
  if (isPrimitive(x)) {
    return x;
  }
  const target = x[PROXY_TARGET];
  return target === undefined ? x : target;
}
const HANDLER: ProxyHandler<any> = {
  get(target: any, p: string | symbol, receiver: any): any {
    if (p === PROXY_TARGET) {
      return target;
    }
    return new Proxy(Reflect.get(target, p, receiver), HANDLER);
  },
  apply(target: any, thisArg: any, argArray: any[]): any {
    return I.byApply(target, unproxy(thisArg), argArray);
  },
}
