import { createContext, useContext, useState, ReactNode } from "react";
import { ViewType } from "@/lib/types";

interface ViewContextType {
  view: ViewType;
  setView: (view: ViewType) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<ViewType>("marketplace");

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error("useView must be used within a ViewProvider");
  }
  return context;
};