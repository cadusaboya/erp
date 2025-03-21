"use client";

import { useEffect, useState } from "react";
import TableBanks from "@/components/banks/TableBanks";
import { fetchBanks } from "@/services/banks";
import Sidebar from "@/components/Sidebar"

interface Bank {
  id: number;
  name: string;
  balance: string;
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBanks = async () => {
    setLoading(true);
    const data = await fetchBanks();
    setBanks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBanks();
  }, []);

  return (
    <div className="flex">
        <Sidebar />
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
