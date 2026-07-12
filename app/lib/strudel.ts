export type StrudelRuntime = {
  initStrudel: () => void;
  evaluate: (code: string) => Promise<unknown> | unknown;
  hush: () => void;
};

let runtimePromise: Promise<StrudelRuntime> | null = null;

export function getStrudel() {
  if (!runtimePromise) {
    runtimePromise = import("@strudel/web").then((module) => {
      module.initStrudel();
      return module as unknown as StrudelRuntime;
    });
  }
  return runtimePromise;
}

export const fallbackStrudel = `setcps(0.72)
stack(
  note("<c4 eb4 f4 g4>*2").s("triangle").gain(0.7),
  note("<c2 c2 ab1 bb1>").s("sine").gain(0.55),
  s("bd ~ [~ bd] ~").gain(0.5)
).slow(2)`;
