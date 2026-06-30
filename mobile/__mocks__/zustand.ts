import { act } from "@testing-library/react-native";

const storeResetFns = new Set<() => void>();

function createStoreImpl<T>(stateCreator: {
  (set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
     get: () => T,
     api: { setState: any; getState: any; subscribe: any; destroy: any }): T;
}) {
  let state: T;
  const listeners = new Set<() => void>();

  const getState = () => state;
  const setState = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
  ) => {
    const next = typeof partial === "function"
      ? (partial as (s: T) => T | Partial<T>)(state)
      : partial;
    if (replace) {
      state = next as T;
    } else {
      state = { ...state, ...next } as T;
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => listeners.clear();

  const api = { setState, getState, subscribe, destroy };
  state = stateCreator(setState, getState, api);
  const initialState = { ...state };
  storeResetFns.add(() => {
    state = { ...initialState };
    listeners.clear();
  });

  const useStore = ((selector?: (s: T) => any) => {
    return selector ? selector(getState()) : getState();
  }) as any;

  return Object.assign(useStore, api);
}

const create = (<T>(stateCreator?: any) => {
  if (stateCreator !== undefined) {
    return createStoreImpl<T>(stateCreator);
  }
  return (creator: Parameters<typeof createStoreImpl<T>>[0]) => createStoreImpl<T>(creator);
}) as unknown as typeof import("zustand").create;

export { create };

export const __resetAllStores = () => {
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn());
  });
};
