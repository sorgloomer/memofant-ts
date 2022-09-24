import { UnreachableCaseError } from "./unreachable-case";

export type Primitive = boolean | number | undefined | string | symbol | bigint | null;

export function isPrimitive(x: unknown): x is Primitive {
    const typex = typeof x;
    switch (typex) {
        case "boolean":
        case "number":
        case "undefined":
        case "string":
        case "symbol":
        case "bigint":
            return true;
        case "function":
        case "object":
            return x === null;
        default:
            throw new UnreachableCaseError(typex);
    }
}

export function isString(x: unknown): x is string {
  return typeof x === 'string';
}

export function isReferenceType(x: unknown): x is {} {
    return !isPrimitive(x);
}

export function isNullish(x: unknown): x is null | undefined {
    return x == null;
}
