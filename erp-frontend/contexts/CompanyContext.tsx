"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Company = {
  id: number;
  name: string;
};

type CompanyContextType = {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

let latestCompanyId: string | null = null;   // ✅ global for Axios

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    // ✅ On mount: try to load persisted company
    const savedId = localStorage.getItem("company_id");
    const savedName = localStorage.getItem("company_name");
    if (savedId && savedName) {
      setSelectedCompany({ id: Number(savedId), name: savedName });
    }
  }, []);

  useEffect(() => {
    // ✅ Sync to localStorage & global for Axios
    if (selectedCompany) {
      localStorage.setItem("company_id", String(selectedCompany.id));
      localStorage.setItem("company_name", selectedCompany.name);
      latestCompanyId = String(selectedCompany.id);        // ✅ super important
    } else {
      localStorage.removeItem("company_id");
      localStorage.removeItem("company_name");
      latestCompanyId = null;
    }
  }, [selectedCompany]);

  return (
    <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};

// ✅ ✅ GLOBAL getter for Axios interceptor
export const getSelectedCompanyId = () => latestCompanyId;
