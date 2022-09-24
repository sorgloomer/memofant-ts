import { getOwn, hasOwn } from "./objects";
import { isReferenceType } from "utils/types";

/**
 * Emulates WeakMap-like functionality by setting an almost invisible symbol property on the keys.
 *
 * There are differences compared to a WeakMap.
 * Pros:
 *  - A key can be essentially copied, for example with calling `impersonateFn`
 * Cons:
 *  - An object being a key is not 100% transparent, can be detected by carefully examining symbol properties with
 *    `Object.getOwnPropertyDescriptors`
 *  - Entries are leaked when the SymbolicWeakMap is garbage collected
 */
export class SymbolicWeakMap<K extends object, V> {
  public readonly symbol: symbol;
  constructor(description?: string) {
    this.symbol = Symbol(description);
  }
  has(key: K): boolean {
    return isReferenceType(key) && hasOwn(key, this.symbol);
  }
  get(key: K): V | undefined {
    return isReferenceType(key) ? getOwn(key as any, this.symbol) : undefined;
  }
  set(key: K, value: V): this {
    if (isReferenceType(key)) {
      Object.defineProperty(key, this.symbol, {
        value,
        enumerable: false,
        writable: false,
        configurable: true, // needed so we can delete it
      });
    }
    return this;
  }
  delete(key: K): boolean {
    const result = this.has(key);
    if (result) {
      delete (key as any)[this.symbol];
    }
    return result;
  }
}
