"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/lancamentos/TableLancamentos";
import { fetchPayments } from "@/services/lancamentos";
import { fetchBanks } from "@/services/banks";
import { PaymentRecord, FilterPaymentType } from "@/types/types";
import { useCompany } from "@/contexts/CompanyContext";

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
    bank_name: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { selectedCompany } = useCompany();     // ✅ you already have this

  const loadPayments = async (
    appliedFilters: FilterPaymentType = filters,
    page = currentPage
  ) => {
    const response = await fetchPayments(appliedFilters, page);
    setData(response.results);
    setTotalCount(response.count);
  };

  const loadBanks = async () => {
    const banks = await fetchBanks();
    setBankOptions(banks);
  };

  // ✅ Fetch banks once on page load
  useEffect(() => {
    loadBanks();
  }, []);

  // ✅ Fetch payments on filter/page changes
  useEffect(() => {
    if (!selectedCompany) return;        // ✅ wait for company to be selected
    loadPayments(filters, currentPage);
  }, [filters, currentPage, selectedCompany]);   // ✅ ✅ ✅ ADD selectedCompany here

  return (
    <div className="p-6">
      <TableComponent
        data={data}
        title="Pagamentos"
        onOrderUpdated={() => loadPayments(filters, currentPage)}
        filters={filters}
        setFilters={setFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalCount={totalCount}
        bankOptions={bankOptions}
      />
    </div>
  );
}
