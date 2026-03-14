"use client";

import { createContext, useContext, useMemo, useState } from "react";

type DashboardUiContextValue = {
  isBlocking: boolean;
  setBlocking: (value: boolean) => void;
};

const DashboardUiContext = createContext<DashboardUiContextValue>({
  isBlocking: false,
  setBlocking: () => {},
});

export function DashboardUiProvider({ children }: { children: React.ReactNode }) {
  const [isBlocking, setBlocking] = useState(false);
  const value = useMemo(() => ({ isBlocking, setBlocking }), [isBlocking]);
  return <DashboardUiContext.Provider value={value}>{children}</DashboardUiContext.Provider>;
}

export function useDashboardUi() {
  return useContext(DashboardUiContext);
}
