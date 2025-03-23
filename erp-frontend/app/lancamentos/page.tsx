"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/lancamentos/TableLancamentos";
import { fetchOrders } from "@/services/lancamentos";
import { FinanceRecord, FilterFinanceRecordType } from "@/types/types";

export default function Page() {
  const [data, setData] = useState<FinanceRecord[]>([]);
  const [filters, setFilters] = useState<FilterFinanceRecordType>({
    startDate: "",
    endDate: "",
    person: "",
    description: "",
    minValue: "",
    maxValue: "",
    type: ["Despesa", "Receita"],
    bank_name: ["Bradesco", "Itau", "Caixa"], // 👈 Add the bank filter here
  });

  const loadOrders = async (appliedFilters: FilterFinanceRecordType = filters) => {
    const ordersData = await fetchOrders(appliedFilters);
    setData(ordersData);
  };

  useEffect(() => {
    loadOrders(filters);
  }, [filters]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent 
          data={data} 
          title="Lançamentos" 
          onOrderUpdated={() => loadOrders(filters)} 
          filters={filters} 
          setFilters={setFilters} 
        />
      </div>
    </div>
  );
}
