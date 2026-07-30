import { useContext } from "react";
import { WindowsContext, type WindowsContextValue } from "./context";

export function useWindows(): WindowsContextValue {
  const value = useContext(WindowsContext);
  if (!value) {
    throw new Error("useWindows must be used inside a WindowsProvider");
  }
  return value;
}
