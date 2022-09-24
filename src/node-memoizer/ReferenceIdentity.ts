import { isReferenceType } from "utils/types";
import { newInfiniteCounter } from "./InfiniteCounter";


type ReferenceIdentity = number | string;
const identities = new WeakMap<object, ReferenceIdentity>();

const { next: infiniteNext } = newInfiniteCounter();

export function referenceIdentity(x: unknown): ReferenceIdentity | undefined {
    if (!isReferenceType(x)) {
        return undefined;
    }
    const oldId = identities.get(x);
    if (oldId !== undefined) {
      return oldId;
    }
    const newId = infiniteNext();
    identities.set(x, newId);
    return newId;
}
