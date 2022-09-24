import { FastAsyncLocal } from "node-fast-async-local/FastAsyncLocal";
import { BareFunction } from "utils/functions";
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
import { Invocation } from "node-memoizer/Invocation";
import { makeProxyFn } from "utils/function-proxy";
import { SymbolicWeakMap } from "utils/SymbolicWeakMap";

enum MagicMode {
  cache, invalidate, refresh, hit
}

export class Memoizer<S extends AnyMemoizerStrategy> {
  private _asyncLocal: AsyncLocal<MemoizerContext<MemoizerStrategyKey<S>>>;
  private _strategy: S;
  private _discriminatorCounter: number = 0;
  private _metaMap = new SymbolicWeakMap<MemoizerMeta<S, any>>("memoizer_meta");
  private _defaults: MemoizerStrategyOptions<S> | undefined;
  private _magic = MagicMode.cache;

  public constructor({
    strategy,
    defaults,
    asyncLocal
  }: MemoizerOptions<S>) {
    this._strategy = strategy;
    this._defaults = defaults;
    this._asyncLocal = asyncLocal ?? new FastAsyncLocal();

    const proto = Object.getPrototypeOf(this);
    this.wrap = proto.wrap.bind(this);
    this.decorate = proto.decorate.bind(this);
    this.runInContext = proto.runInContext.bind(this);
    this.refresh = proto.refresh.bind(this);
    this.invalidate = proto.invalidate.bind(this);
    this.invalidateFn = proto.invalidateFn.bind(this);
    this.invalidateByFn = proto.invalidateByFn.bind(this);
    this.invalidateByName = proto.invalidateByName.bind(this);
    this.invalidateAll = proto.invalidateAll.bind(this);
  }

  public runInContext<T>(cb: () => T): T {
    return this._asyncLocal.run({
      cache: new Map(),
      depender: undefined,
    }, cb);
  }

  public wrap<F extends BareFunction>(
    fn: F,
    options?: MemoizeOptions & MemoizerStrategyOptions<S>,
  ): F {
    const unique = ++this._discriminatorCounter;
    const { createEncoder, createKeyMap } = this._strategy;
    const encoder = createEncoder(options);
    const memoized = makeProxyFn(fn, invocation => {
      const callerMagic = this._magic;
      switch (callerMagic) {
        case MagicMode.hit:
          throw new MemoizerError("more than one function was called during invalidate or refresh");
        case MagicMode.refresh:
          this._magic = MagicMode.cache;
          break;
        case MagicMode.invalidate:
          this._magic = MagicMode.hit;
          break;
      }
      const { cache, depender } = this._getContext();
      const key = encoder(invocation);
      let innerCache = cache.get(meta) as (
        SimpleMap<MemoizerStrategyKey<S>, MemoizerCachedItem<MemoizerStrategyKey<S>, ReturnType<F>>> | undefined
        );
      if (callerMagic === MagicMode.invalidate) {
        deepInvalidate(innerCache?.get(key));
        return undefined as any;
      }
      if (innerCache === undefined) {
        innerCache = createKeyMap();
        cache.set(meta, innerCache);
      }
      if (callerMagic === MagicMode.cache) {
        const oldItem = innerCache.get(key);
        if (oldItem && !oldItem.invalidated) {
          return trackCachedItem(oldItem, depender).get();
        }
      }
      const newItem = trackCachedItem(
        new MemoizerCachedItem<MemoizerStrategyKey<S>, ReturnType<F>>(key, innerCache),
        depender,
      );
      const newContext = { cache, depender: newItem };
      const collapsed = this._asyncLocal.run(newContext, () => collapse(() => invocation.forward()));
      newItem.get = collapsed;
      innerCache.set(key, newItem);
      if (callerMagic === MagicMode.refresh) {
        this._magic = MagicMode.hit;
      }
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
      target: {} | undefined,
      propertyKey: PropertyKey | undefined,
      descriptor: PropertyDescriptor,
    ) => {
      descriptor.value = this.wrap(descriptor.value, options);
    };
  }

  public invalidate(fn: () => unknown): void {
    this._magic = MagicMode.invalidate;
    try {
      fn();
    } finally {
      // @ts-ignore
      if (this._magic !== MagicMode.hit) {
        throw new MemoizerError('no memoized function was called during invalidate');
      }
      this._magic = MagicMode.cache;
    }
  }

  public refresh<R>(fn: () => R): R {
    this._magic = MagicMode.refresh;
    try {
      return fn();
    } finally {
      // @ts-ignore
      if (this._magic !== MagicMode.hit) {
        throw new MemoizerError('no memoized function was called during refresh');
      }
      this._magic = MagicMode.cache;
    }
  }

  public invalidateByName<O extends { [L in K]: BareFunction }, K extends PropertyKey>(target: O, propertyKey: K, args: Parameters<O[K]>) {
    this.invalidateByFn(target[propertyKey], args, target as any);
  }

  public invalidateAll() {
    this._getContext().cache.clear();
  }

  public invalidateFn(fn: BareFunction) {
    const meta = this._metaMap.get(fn);
    if (meta === undefined) {
      throw new MemoizerError(`unable to invalidate, function ${fn.name || "<anonymous>"} is not memoized`);
    }
    const cacheL2 = this._getContext().cache.get(meta);
    if (cacheL2 !== undefined) {
      cacheL2.forEach(deepInvalidate);
      cacheL2.clear();
    }
  }

  public invalidateByFn<F extends BareFunction>(
    fn: F,
    args: Parameters<F>,
    thisArg?: ThisParameterType<F>,
  ) {
    const meta = this._metaMap.get(fn);
    if (meta === undefined) {
      throw new MemoizerError(`unable to invalidate, function ${fn.name || "<anonymous>"} is not memoized`);
    }
    const key = meta.encoder(new Invocation(fn, args, thisArg!));
    const item = this._getContext().cache.get(meta)?.get(key);
    deepInvalidate(item);
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
