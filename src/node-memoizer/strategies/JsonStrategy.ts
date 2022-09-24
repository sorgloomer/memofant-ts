import { Discriminator, MemoizerEncoder, MemoizerStrategy } from "node-memoizer/Memoizer.types";
import { BareFunction } from "utils/functions";
import { Invocation, InvocationParameters } from "node-memoizer/Invocation";
import { referenceIdentity } from "node-memoizer/ReferenceIdentity";
import { UnreachableCaseError } from "utils/unreachable-case";
import { Memoizer } from "node-memoizer/Memoizer";
import { dropTrailingUndefineds } from "node-memoizer/Memoizer.utils";

interface JsonStrategyOptions {
  considerThisArg?: boolean;
}

type JsonStrategyType = MemoizerStrategy<string, JsonStrategyOptions>;
export const JsonStrategy: JsonStrategyType = {
  createEncoder<F extends BareFunction>(
    options?: JsonStrategyOptions,
  ): MemoizerEncoder<string, F> {
    const considerThisArg = options?.considerThisArg ?? false;
    return (i: InvocationParameters<F>) => JSON.stringify([
      considerThisArg ? referenceIdentity(i.thisArg) : null,
      i.args,
    ]);
  },
  createKeyMap() {
    return new Map();
  },
  createKeySet() {
    return new Set();
  },
};

export function createJsonMemoizer(defaults?: JsonStrategyOptions): Memoizer<JsonStrategyType> {
  return new Memoizer({
    strategy: JsonStrategy,
    defaults,
  });
}



export function stringIdentity(x: any) {
  const type = typeof x;
  switch (type) {
    case "function":
      return `F:${referenceIdentity(x)}`;
    case "object":
      return x === null ? 'N' : `O:${referenceIdentity(x)}`;
    case "bigint":
      return `i:${x}`;
    case "string":
      return `s:${x}`;
    case "boolean":
      return x ? 't' : 'f';
    case "undefined":
      return "u";
    case "number":
      return `n:${x}`;
    case "symbol":
      throw new Error('Cannot convert symbol to string');
    default:
      throw new UnreachableCaseError(type);
  }
}
