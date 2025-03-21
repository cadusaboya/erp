"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/contas/TableContas";
import Sidebar from "@/components/Sidebar";
import { fetchRecords } from "@/services/records";
import { FinanceRecord } from "@/types/types";

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
  const [filters, setFilters] = useState<FiltersParams>({
    startDate: "",
    endDate: "",
    status: ["em aberto", "vencido"],
    person: "",
    description: "",
    docNumber: "",
  });

  const loadRecords = async (activeFilters: FiltersParams) => {
    const fetchedData = await fetchRecords("bill", activeFilters);
    setData(fetchedData);
  };

  useEffect(() => {
    loadRecords(filters);
  }, [filters]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent
          title="Contas a Pagar"
          data={data}
          type="bill"
          filters={filters}                // ✅ Pass current filters
          setFilters={setFilters}          // ✅ Pass setter to child
          onRecordUpdated={() => loadRecords(filters)} // Refresh records when something changes
        />
      </div>
    </div>
  );
}