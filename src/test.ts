import { createJsonMemoizer } from "node-memoizer/strategies/JsonStrategy";
import * as I from "node-memoizer/invocation";

const memoizer = createJsonMemoizer();

let counter = 0;
const fibo = memoizer.wrap((n: number): number => {
  counter++;
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
  console.log(I.byProxy(foo1).fibo(60).execute(), foo1.counter);
  memoizer.invalidate(I.byCall(foo1.fibo, foo1, 50));
  console.log(foo1.fibo(60), foo1.counter);

  console.log(fibo(60), counter);
  memoizer.invalidate(I.byArg(fibo, 50));
  console.log(fibo(60), counter);
});
