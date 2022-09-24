import { isMutableRef } from "utils/types";
import { newInfiniteCounter } from "./InfiniteCounter";
import { SymbolicWeakMap } from "utils/SymbolicWeakMap";


type ReferenceIdentity = number | string;
const identities = new SymbolicWeakMap<ReferenceIdentity>('reference_identity');

const { next: infiniteNext } = newInfiniteCounter();

export function referenceIdentity(x: unknown): ReferenceIdentity | undefined {
    if (!isMutableRef(x)) {
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
