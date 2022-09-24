export class UnreachableCaseError extends Error {
    constructor(value: never) {
        super(String(value));
    }
}
