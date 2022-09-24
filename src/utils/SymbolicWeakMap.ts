import { hasOwnProperty } from "./objects";

export class SymbolicWeakMap<V> {
  public readonly symbol: symbol;
  constructor(description?: string) {
    this.symbol = Symbol(description);
  }
  has(x: unknown) {
    const { symbol } = this;
    return hasOwnProperty(x, symbol);
  }
  get(x: any): V | undefined {
    const { symbol } = this;
    return hasOwnProperty(x, symbol) ? x[symbol] : undefined;
  }
  set(x: any, value: V): void {
    const { symbol } = this;
    Object.defineProperty(x, symbol, {
      value,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }
}
