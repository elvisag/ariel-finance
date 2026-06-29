import { act } from "@testing-library/react-native";
import type * as Zustand from "zustand";

const { create: actualCreate } = jest.requireActual<typeof Zustand>("zustand");

const storeResetFns = new Set<() => void>();

export const create = (<T>() => {
  return (stateCreator: Zustand.StateCreator<T>) => {
    const store = actualCreate(stateCreator);
    const initialState = store.getState();
    storeResetFns.add(() => store.setState(initialState, true));
    return store;
  };
}) as typeof Zustand.create;

export const __resetAllStores = () => {
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn());
  });
};
