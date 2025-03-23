"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/lancamentos/TableLancamentos";
import { fetchOrders } from "@/services/lancamentos";
import { fetchBanks } from "@/services/banks";
import { FinanceRecord, FilterFinanceRecordType } from "@/types/types";

export default function Page() {
  const [data, setData] = useState<FinanceRecord[]>([]);
  const [bankOptions, setBankOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterFinanceRecordType>({
    startDate: "",
    endDate: "",
    person: "",
    description: "",
    minValue: "",
    maxValue: "",
    type: ["Despesa", "Receita"],
    bank_name: [], // ⬅️ initially empty
  });

  const loadOrders = async (appliedFilters: FilterFinanceRecordType = filters) => {
    const ordersData = await fetchOrders(appliedFilters);
    setData(ordersData);
  };

  const loadBanks = async () => {
    const banks = await fetchBanks();
    const bankNames = banks.map((b: any) => b.name);
    setBankOptions(bankNames);
  };

  useEffect(() => {
    loadBanks();
  }, []);
  
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
          bankOptions={bankOptions}
        />
      </div>
    </div>
  );
}
