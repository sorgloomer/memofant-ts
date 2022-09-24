export type AnyFunction = (...args: any[]) => any;

export type AnyFunctionNoThisArg = (this: undefined, ...args: any[]) => any;
