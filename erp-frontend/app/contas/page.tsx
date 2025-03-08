"use client";

import { useState, useEffect } from "react";
import { fetchBills } from "@/services/bills";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/TableContas";

interface Bill {
  id: number;
  person: string;
  description: string;
  date_due: string;
  value: string;
  doc_number?: string;
  event?: string | null;
  status: "em aberto" | "pago" | "vencido";
}

export default function Page() {
  const [data, setBills] = useState<Bill[]>([]);

  const loadBills = async () => {
    const data = await fetchBills();
    setBills(data);
  };

  const handleBillCreated = async () => {
    await loadBills(); // Fetch the updated list from the API
  };
  
  useEffect(() => {
    loadBills();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent data={data} title="Contas a Pagar" onBillCreated={handleBillCreated} />
      </div>
    </div>
  );
}
