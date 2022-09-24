import { BareFunction } from "utils/functions";

export interface InvocationParameters<T extends BareFunction> {
  args: Parameters<T>;
  thisArg: ThisParameterType<T>;
}

export class Invocation<T extends BareFunction>
  implements InvocationParameters<T>
{
  constructor(
    public target: T,
    public args: Parameters<T>,
    public thisArg: ThisParameterType<T>,
  ) { }
  forward(): ReturnType<T> {
    return this.invokeWith(this);
  }
  invokeWith(params: InvocationParameters<T>): ReturnType<T> {
    return this.target.apply(params.thisArg, params.args);
  }
}
