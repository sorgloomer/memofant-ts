import { FastAsyncLocal } from "node-fast-async-local/FastAsyncLocal";
import { AnyFunction } from "utils/functions";
import { AsyncLocal } from "node-fast-async-local/AsyncLocal";
import {
  AnyMemoizerStrategy,
  MemoizeOptions,
  MemoizerContext,
  MemoizerMeta,
  MemoizerOptions,
  MemoizerStrategyKey,
  MemoizerStrategyOptions,
  SimpleMap,
} from "node-memoizer/Memoizer.types";
import {
  collapse,
  deepInvalidate,
  MemoizerCachedItem,
  MemoizerError,
  trackCachedItem,
} from "node-memoizer/Memoizer.utils";
import { Invocation, InvocationData } from "node-memoizer/invocation";
import { makeProxyFn } from "utils/function-proxy";
import { SymbolicWeakMap } from "utils/SymbolicWeakMap";

export class Memoizer<S extends AnyMemoizerStrategy> {
  private _asyncLocal: AsyncLocal<MemoizerContext<MemoizerStrategyKey<S>>>;
  private _strategy: S;
  private _metaMap = new SymbolicWeakMap<AnyFunction, MemoizerMeta<S, any>>("memoizer_meta");
  private _defaults: MemoizerStrategyOptions<S> | undefined;

  public constructor({
    strategy,
    defaults,
    asyncLocal = new FastAsyncLocal(),
  }: MemoizerOptions<S>) {
    this._strategy = strategy;
    this._defaults = defaults;
    this._asyncLocal = asyncLocal;

    const proto = Object.getPrototypeOf(this);
    this.wrap = proto.wrap.bind(this);
    this.decorate = proto.decorate.bind(this);
    this.runInContext = proto.runInContext.bind(this);
    this.refresh = proto.refresh.bind(this);
    this.invalidate = proto.invalidate.bind(this);
    this.invalidateAll = proto.invalidateAll.bind(this);
  }

  public runInContext<T>(cb: () => T): T {
    return this._asyncLocal.run({
      cacheMap: this._createCacheByFnMap(),
      depender: undefined,
    }, cb);
  }

  public wrap<F extends AnyFunction>(
    fn: F,
    options?: MemoizeOptions & MemoizerStrategyOptions<S>,
  ): F {
    const { createEncoder, createKeyMap } = this._strategy;
    const encoder = createEncoder(options);
    const memoized = makeProxyFn(fn, invocation => {
      const { cacheMap, depender } = this._getContext();
      const key = encoder(invocation);
      let innerCache = cacheMap.get(meta) as (
        SimpleMap<MemoizerStrategyKey<S>, MemoizerCachedItem<MemoizerStrategyKey<S>, ReturnType<F>>> | undefined
        );
      if (innerCache === undefined) {
        innerCache = createKeyMap();
        cacheMap.set(meta, innerCache);
      }
        const oldItem = innerCache.get(key);
        if (oldItem && !oldItem.invalidated) {
          return trackCachedItem(oldItem, depender).get();
        }
      const newItem = trackCachedItem(
        new MemoizerCachedItem<MemoizerStrategyKey<S>, ReturnType<F>>(key, innerCache),
        depender,
      );
      const newContext = { cacheMap, depender: newItem };
      const collapsed = this._asyncLocal.run(newContext, () => collapse(() => invocation.execute()));
      newItem.get = collapsed;
      innerCache.set(key, newItem);
      return collapsed();
    });

    const meta: MemoizerMeta<S, F> = {
      originalFn: fn,
      proxiedFn: memoized,
      encoder,
    };
    this._metaMap.set(memoized, meta);
    return memoized;
  }

  public decorate(options?: MemoizeOptions & MemoizerStrategyOptions<S>): MethodDecorator {
    return (
      target: object | undefined,
      propertyKey: PropertyKey | undefined,
      descriptor: PropertyDescriptor,
    ) => {
      descriptor.value = this.wrap(descriptor.value, options);
    };
  }

  public invalidate<F extends AnyFunction>({target, args, thisArg}: InvocationData<F>): void {
    const meta = this._metaMap.get(target);
    if (meta === undefined) {
      throw new MemoizerError(`unable to invalidate, function ${target || "<anonymous>"} is not memoized`);
    }
    const key = meta.encoder(new Invocation(meta.originalFn, args, thisArg!));
    const item = this._getContext().cacheMap.get(meta)?.get(key);
    deepInvalidate(item);
  }

  public refresh<F extends AnyFunction>(invocation: Invocation<F>): ReturnType<F> {
    this.invalidate(invocation);
    return invocation.execute();
  }

  private _createCacheByFnMap() {
    return new WeakMap();
  }
  public invalidateAll(fn?: AnyFunction) {
    const context = this._getContext();
    if (fn === undefined) {
      context.cacheMap = this._createCacheByFnMap();
      return;
    }

    const meta = this._metaMap.get(fn);
    if (meta === undefined) {
      throw new MemoizerError(`unable to invalidate, function ${fn.name || "<anonymous>"} is not memoized`);
    }
    const cacheL2 = this._getContext().cacheMap.get(meta);
    if (cacheL2 !== undefined) {
      cacheL2.forEach(deepInvalidate);
      cacheL2.clear();
    }
  }

  private _getContext() {
    const context = this._asyncLocal.getStore();
    if (context === undefined) {
      throw new MemoizerError("no context found, please ensure that the invocation or " +
        `any of its parents is wrapped in memoizer.${this.runInContext.name}`);
    }
    return context;
  };

}
