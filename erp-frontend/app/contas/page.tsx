"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/contas/TableContas";
import { fetchRecords } from "@/services/records";
import { fetchBanks } from "@/services/banks";
import { FinanceRecord } from "@/types/types";
import { useCompany } from "@/contexts/CompanyContext";   // ✅ ADD THIS

interface BankOption {
  id: number;
  name: string;
}

export type FiltersParams = {
  startDate?: string;
  endDate?: string;
  status?: string[];
  person?: string;
  description?: string;
  docNumber?: string;
  minValue?: string;
  maxValue?: string;
};

export default function Page() {
  const [data, setData] = useState<FinanceRecord[]>([]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [filters, setFilters] = useState<FiltersParams>({
    startDate: "2023-01-01",
    endDate: "",
    status: ["em aberto", "vencido", "parcial", "agendado"],
    person: "",
    description: "",
    docNumber: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { selectedCompany } = useCompany();              // ✅ ADD THIS

  const loadBanks = async () => {
    const banks = await fetchBanks();
    setBankOptions(banks);
  };

  const loadRecords = async (activeFilters: FiltersParams, page = 1) => {
    const response = await fetchRecords("bill", activeFilters, page);
    setData(response.results);
    setTotalCount(response.count);
  };

  // ✅ Fetch banks once on load
  useEffect(() => {
    loadBanks();
  }, []);

  // ✅ Refetch records when filters, page or company changes
  useEffect(() => {
    if (!selectedCompany) return;                       // ✅ avoid fetch if no company
    loadRecords(filters, currentPage);
  }, [filters, currentPage, selectedCompany]);          // ✅ ✅ ✅ ADD selectedCompany here

  return (
    <div className="flex">
      <div className="flex-1 p-6">
        <TableComponent
          title="Contas a Pagar"
          data={data}
          type="bill"
          filters={filters}
          setFilters={setFilters}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalCount={totalCount}
          onRecordUpdated={() => loadRecords(filters, currentPage)}
          bankOptions={bankOptions}
        />
      </div>
    </div>
  );
}
