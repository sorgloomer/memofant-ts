import { AnyFunction, AnyFunctionNoThisArg } from "utils/functions";

export interface InvocationData<T extends AnyFunction> extends InvocationParameters<T> {
  target: T;
}

export interface InvocationParameters<T extends AnyFunction> {
  args: Parameters<T>;
  thisArg: ThisParameterType<T>;
}

export class Invocation<T extends AnyFunction>
  implements InvocationData<T> {
  public constructor(
    public target: T,
    public args: Parameters<T>,
    public thisArg: ThisParameterType<T>,
  ) {
  }

  public execute(): ReturnType<T> {
    return this.target.apply(this.thisArg, this.args);
  }
}

export function from<F extends AnyFunction>(
  data: InvocationData<F>,
): Invocation<F> {
  return new Invocation(data.target, data.args, data.thisArg);
}

export function byMember<
  O extends { [K in N]: F } & ThisParameterType<F>,
  F extends AnyFunction,
  N extends PropertyKey,
>(
  thisArg: O,
  propertyName: N,
  args: Parameters<F>,
): Invocation<F> {
  return new Invocation(thisArg[propertyName], args, thisArg);
}

export function byApply<F extends AnyFunction>(target: F, thisArg: ThisParameterType<F>, args: Parameters<F>) {
  return new Invocation(target, args, thisArg);
}

export function byCall<F extends AnyFunction>(target: F, thisArg: ThisParameterType<F>, ...args: Parameters<F>) {
  return new Invocation(target, args, thisArg);
}

export function byArgs<F extends AnyFunctionNoThisArg>(target: F, args: Parameters<F>) {
  return new Invocation<F>(target, args, undefined as any);
}

export function byArg<F extends AnyFunctionNoThisArg>(target: F, ...args: Parameters<F>) {
  return new Invocation<F>(target, args, undefined as any);
}

export { byProxy } from "./invocation-byproxy";
