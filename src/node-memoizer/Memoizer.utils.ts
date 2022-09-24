import { SimpleMap } from "node-memoizer/Memoizer.types";
import { BareFunction } from "utils/functions";
import { isNullish } from "utils/types";

export function mapPop<K, V>(map: SimpleMap<K, V>, key: K): V | undefined {
  const result = map.get(key);
  map.delete(key);
  return result;
}

export function collapse<R>(fn: () => R): () => R {
  try {
    const value = fn();
    return () => value;
  } catch (error) {
    return () => {
      throw error;
    }
  }
}

export function trackCachedItem<K, T>(item: MemoizerCachedItem<K, T>, depender: MemoizerCachedItem<K, unknown> | undefined) {
  if (depender !== undefined) {
    item.dependers.add(depender);
  }
  return item;
}

/*
export function discriminatorGenerator(
  target: {} | undefined,
  propertyKey: PropertyKey | undefined,
  fn: BareFunction,
  discriminatorOpt: string | undefined,
  unique: string | number,
) {
  const result = `${String(propertyKey || fn.name || '<anonymous>')}.${unique}`;
  const tn = target?.constructor?.name;
  return tn ? `${tn}.${result}` : result;
}
*/
export class MemoizerError extends Error {}

export function throwInfiniteRecursion(): never {
  throw new MemoizerError('Infinite recursion detected');
}

export function dropTrailingUndefineds(args: unknown[]): unknown[] {
  let i = args.length - 1;
  for (;;) {
    if (i < 0 || args[i] !== undefined) {
      args.length = i + 1;
      return args;
    }
    i--;
  }
}

export type AnyMemoizerCachedItem = MemoizerCachedItem<unknown, unknown>;

export class MemoizerCachedItem<K, T> {
  public dependers = new Set<MemoizerCachedItem<K, unknown>>();
  public get: () => T = throwInfiniteRecursion;
  public invalidated = false;
  constructor(
    private readonly key: K,
    private readonly cache: SimpleMap<K, MemoizerCachedItem<K, unknown>>,
  ) {}
  public invalidate(): boolean {
    if (this.invalidated) {
      return false;
    }
    this.invalidated = true;
    this.cache.delete(this.key);
    return true;
  }
}

export function deepInvalidate(item: MemoizerCachedItem<unknown, unknown> | undefined): void {
  if (isNullish(item)) {
    return;
  }
  const queue: MemoizerCachedItem<unknown, unknown>[] = [];
  visit(item);
  for (; ;) {
    const item = queue.shift();
    if (item === undefined) {
      return;
    }
    for (let depender of item.dependers) {
      visit(depender);
    }
  }
  function visit(item: MemoizerCachedItem<unknown, unknown>) {
    if (item.invalidate()) {
      queue.push(item);
    }
  }
}

