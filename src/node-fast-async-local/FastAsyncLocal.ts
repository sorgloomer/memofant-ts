import { AsyncLocalStorage } from 'async_hooks';
import { Map as ImMap } from 'immutable';
import { AsyncLocal } from "node-fast-async-local/AsyncLocal";


type MyMap = ImMap<unknown, unknown>;
let globalAsyncLocalStorage: AsyncLocalStorage<MyMap> | undefined = undefined;

function getGlobalAsyncLocalStorage(): AsyncLocalStorage<MyMap> {
  if (globalAsyncLocalStorage !== undefined) {
    return globalAsyncLocalStorage;
  }
  return globalAsyncLocalStorage = new AsyncLocalStorage<MyMap>();
}

let keyCounter = 0;

export class FastAsyncLocal<T> implements AsyncLocal<T> {
  private readonly _key: unknown = ++keyCounter;

  getStore(): T | undefined {
    return getGlobalAsyncLocalStorage()?.getStore()?.get(this._key) as T | undefined;
  }

  enterWith(store: T) {
    const gals = getGlobalAsyncLocalStorage();
    const storeMap = getOrCreateStoreMap(gals);
    gals.enterWith(storeMap.set(this._key, store));
  }

  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R {
    const gals = getGlobalAsyncLocalStorage();
    const storeMap = getOrCreateStoreMap(gals);
    return gals.run(storeMap.set(this._key, store), callback, ...args);
  }

  exit<R>(callback: (...args: any[]) => R, ...args: any[]): R {
    const gals = getGlobalAsyncLocalStorage();
    const storeMap = gals.getStore();
    if (storeMap === undefined) {
      return callback(...args);
    }
    return gals.run(storeMap.delete(this._key), callback, ...args);
  }
}

function getOrCreateStoreMap(gals: AsyncLocalStorage<MyMap>) {
  return gals.getStore() ?? ImMap();
}
