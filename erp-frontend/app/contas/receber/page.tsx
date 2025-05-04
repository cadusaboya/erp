"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/contas/TableContas";
import { fetchRecords } from "@/services/records";
import { fetchBanks } from "@/services/banks";
import { FinanceRecord } from "@/types/types";

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
};

export default function Page() {
  const [data, setData] = useState<FinanceRecord[]>([]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [filters, setFilters] = useState<FiltersParams>({
    startDate: "",
    endDate: "",
    status: ["em aberto", "vencido", "parcial"],
    person: "",
    description: "",
    docNumber: "",
  });

  const loadBanks = async () => {
    const banks = await fetchBanks();
    setBankOptions(banks); // Don't map to just names
  };

  const loadRecords = async (activeFilters: FiltersParams) => {
    const fetchedData = await fetchRecords("income", activeFilters);
    setData(fetchedData);
  };

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    loadRecords(filters);
  }, [filters]);

  return (
    <div className="flex">
      <div className="flex-1 p-6">
        <TableComponent
          title="Contas a Receber"
          data={data}
          type="income"
          filters={filters}                // ✅ Pass current filters
          setFilters={setFilters}          // ✅ Pass setter to child
          onRecordUpdated={() => loadRecords(filters)} // Refresh records when something changes
          bankOptions={bankOptions}
        />
      </div>
    </div>
  );
}