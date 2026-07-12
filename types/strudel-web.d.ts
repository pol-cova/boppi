declare module "@strudel/web" {
  export function initStrudel(): void;
  export function evaluate(code: string): Promise<unknown> | unknown;
  export function hush(): void;
}
