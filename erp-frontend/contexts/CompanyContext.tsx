// contexts/CompanyContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type CompanyContextType = {
  company: string | null;
  setCompany: (id: string | null) => void;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<string | null>(null);

  // ✅ Restore company_id from localStorage, or default to 1
  useEffect(() => {
    const storedId = localStorage.getItem("company");

    if (storedId) {
      setCompany(storedId);
    } else {
      localStorage.setItem("company", "1");
      setCompany("1");
    }
  }, []);

  return (
    <CompanyContext.Provider value={{ company, setCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
