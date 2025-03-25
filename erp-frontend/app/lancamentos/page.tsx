"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/lancamentos/TableLancamentos";
import { fetchPayments } from "@/services/lancamentos"; // updated to use fetchPayments
import { fetchBanks } from "@/services/banks";
import { PaymentRecord, FilterPaymentType } from "@/types/types"; // assuming you'll have a new type for payments

export default function Page() {
  const [data, setData] = useState<PaymentRecord[]>([]);
  const [bankOptions, setBankOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterPaymentType>({
    startDate: "",
    endDate: "",
    person: "",
    description: "",
    minValue: "",
    maxValue: "",
    type: ["Despesa", "Receita"],
    bank_name: [], // ⬅️ initially empty
  });

  const loadPayments = async (appliedFilters: FilterPaymentType = filters) => {
    const paymentsData = await fetchPayments(appliedFilters);
    setData(paymentsData);
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
    loadPayments(filters);
  }, [filters]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent 
          data={data} 
          title="Pagamentos" 
          onOrderUpdated={() => loadPayments(filters)} 
          filters={filters} 
          setFilters={setFilters}
          bankOptions={bankOptions}
        />
      </div>
    </div>
  );
}
