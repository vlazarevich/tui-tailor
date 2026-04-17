import { useReducer, type ReactNode } from "react";
import {
  composerReducer,
  ComposerStateContext,
  ComposerDispatchContext,
  type ComposerState,
} from "./composerContext";

export function ComposerProvider({
  initialState,
  children,
}: {
  initialState: ComposerState;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(composerReducer, initialState);
  return (
    <ComposerStateContext value={state}>
      <ComposerDispatchContext value={dispatch}>{children}</ComposerDispatchContext>
    </ComposerStateContext>
  );
}
