"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/lancamentos/TableLancamentos";
import { fetchPayments } from "@/services/lancamentos"; // updated to use fetchPayments
import { fetchBanks } from "@/services/banks";
import { PaymentRecord, FilterPaymentType } from "@/types/types"; // assuming you'll have a new type for payments

interface BankOption {
  id: number;
  name: string;
}

export default function Page() {
  const [data, setData] = useState<PaymentRecord[]>([]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
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
    setBankOptions(banks); // Don't map to just names
  };

  useEffect(() => {
    loadBanks();
  }, []);
  
  useEffect(() => {
    loadPayments(filters);
  }, [filters]);

  return (
    <div className="p-6">
      <TableComponent 
        data={data} 
        title="Pagamentos" 
        onOrderUpdated={() => loadPayments(filters)} 
        filters={filters} 
        setFilters={setFilters}
        bankOptions={bankOptions}
      />
    </div>
  );
}
