import { BareFunction } from "utils/functions";
import { InvocationParameters } from "node-memoizer/Invocation";
import { AsyncLocal } from "node-fast-async-local/AsyncLocal";
import { MemoizerCachedItem } from "node-memoizer/Memoizer.utils";

export interface SimpleMap<K, V> {
  get(k: K): V | undefined;

  set(k: K, v: V): void;

  delete(k: K): void;

  forEach(cb: (value: V, key: K, map: this) => void): void;

  clear(): void;
}

export interface SimpleSet<T> extends Iterable<T> {
  has(item: T): boolean;

  add(item: T): void;

  delete(item: T): void;
}

export interface MemoizeOptions {
//  discriminator?: string,
}

export type MemoizerEncoder<K, F extends BareFunction>
  = (invocation: InvocationParameters<F>) => K;

export type AnyMemoizerMeta = MemoizerMeta<AnyMemoizerStrategy, BareFunction>;
export type MemoizerMeta<S extends AnyMemoizerStrategy, F extends BareFunction> = {
//  discriminator: Discriminator;
  encoder: MemoizerEncoder<MemoizerStrategyKey<S>, F>;
  originalFn: F;
  proxiedFn: F;
}

export interface MemoizerOptions<S extends AnyMemoizerStrategy> {
  strategy: S;
  defaults?: MemoizerStrategyOptions<S>;
  asyncLocal?: AsyncLocal<MemoizerContext<MemoizerStrategyKey<S>>>;
}

export type MemoizerContext<K> = {
  cache: Map<AnyMemoizerMeta, SimpleMap<K, MemoizerCachedItem<K, unknown>>>;
  depender: MemoizerCachedItem<K, any> | undefined;
}

export type Discriminator = string;

export interface MemoizerEncoderFactory<K, O> {
  <F extends BareFunction>(options?: O): MemoizerEncoder<K, F>;
}

export type AnyMemoizerStrategy = MemoizerStrategy<any, any>;

export interface MemoizerStrategy<K, O> {
  createEncoder: MemoizerEncoderFactory<K, O>;

  createKeyMap<V>(): SimpleMap<K, V>;

  createKeySet(): SimpleSet<K>;
}

export type MemoizerStrategyKey<T extends AnyMemoizerStrategy>
  = T extends MemoizerStrategy<infer K, any> ? K : never;
export type MemoizerStrategyOptions<T extends AnyMemoizerStrategy>
  = T extends MemoizerStrategy<any, infer O> ? O : never;

