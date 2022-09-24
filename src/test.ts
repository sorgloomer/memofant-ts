import { createJsonMemoizer } from "node-memoizer/strategies/JsonStrategy";

const memoizer = createJsonMemoizer();

const fibo = memoizer.wrap((n: number): number => {
  if (n > 1) return fibo(n - 1) + fibo(n - 2);
  if (n < 0) return fibo(n + 2) - fibo(n + 1);
  return n;
});

class Foo {
  public counter = 0;

  @memoizer.decorate()
  fibo(n: number): number {
    this.counter++;
    if (n > 1) return this.fibo(n - 1) + this.fibo(n - 2);
    if (n < 0) return this.fibo(n + 2) - this.fibo(n + 1);
    return n;
  }
}

const foo1 = new Foo();
memoizer.runInContext(() => {
  console.log(foo1.fibo(60));
  console.log(foo1.counter);
  memoizer.invalidate(() => foo1.fibo(50));
  console.log(foo1.fibo(60));
  console.log(foo1.counter);
});
