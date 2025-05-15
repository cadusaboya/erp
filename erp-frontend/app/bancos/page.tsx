"use client";

import { useEffect, useState } from "react";
import TableBanks from "@/components/banks/TableBanks";
import { fetchBanks } from "@/services/banks";
import { Bank } from "@/types/types";
import { useCompany } from "@/contexts/CompanyContext";   // ✅ ADD THIS

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCompany } = useCompany();               // ✅ ADD THIS

  const loadBanks = async () => {
    setLoading(true);
    const data = await fetchBanks();
    setBanks(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedCompany) return;                         // ✅ wait until company is selected
    loadBanks();                                          // ✅ refetch when company changes
  }, [selectedCompany]);                                  // ✅ ADD selectedCompany dependency

  return (
    <div className="flex">
      <div className="flex-1 p-6">
        {loading ? (
          <p>Carregando contas bancárias...</p>
        ) : (
          <TableBanks banks={banks} onBankUpdated={loadBanks} />
        )}
      </div>
    </div>
  );
}
