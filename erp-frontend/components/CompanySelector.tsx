"use client";

import { useEffect, useState } from "react";
import { useCompany, Company } from "@/contexts/CompanyContext";
import { api } from "@/lib/axios";

export default function CompanySelector() {
  const { selectedCompany, setSelectedCompany } = useCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get("/accounts/companies/");
        const data = response.data;
        setCompanies(data);

        if (!selectedCompany && data.length > 0) {
          setSelectedCompany(data[0]);        // ✅ Axios sync will auto update
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [selectedCompany, setSelectedCompany]);

  if (loading) return <div className="p-4 text-xs">Carregando empresas...</div>;

  return (
    <div className="p-4">
      <label className="text-xs font-semibold">Empresa</label>
      <select
        value={selectedCompany?.id ?? ""}
        onChange={(e) => {
          const company = companies.find(c => c.id === Number(e.target.value));
          if (company) setSelectedCompany(company);   // ✅ Axios sync will auto update
        }}
        className="w-full mt-1 border rounded-md text-sm px-2 py-1"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  );
}
