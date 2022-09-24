import { addSmall } from './decimal';

export interface InfiniteCounter {
  peek(): number | string;

  next(): number | string;
}

export function newInfiniteCounter(): InfiniteCounter {
  let counter = 0;
  let prefix: string | undefined = undefined;

  function advance() {
    counter++;
    if (counter === 1000000000000000 /* <= Number.MAX_SAFE_INTEGER */) {
      counter = 0;
      prefix = (prefix === undefined) ? "1" : addSmall(prefix, 1);
    }
  }

  function next() {
    const peeked = peek();
    advance();
    return peeked;
  }

  function peek(): number | string {
    return prefix === undefined ? counter : `${prefix}${counter}`;
  }

  return {
    next,
    peek,
  };
}
