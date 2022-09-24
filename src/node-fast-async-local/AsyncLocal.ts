export interface AsyncLocal<T> {
  getStore(): T | undefined;
  enterWith(store: T): void;
  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R ;
  exit<R>(callback: (...args: any[]) => R, ...args: any[]): R;
}
