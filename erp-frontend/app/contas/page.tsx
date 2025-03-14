"use client";

import { useState, useEffect } from "react";
import { fetchRecords } from "@/services/records"; // ✅ Import generalized fetch
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/TableContas";

interface FinanceRecord {
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
  const [data, setData] = useState<FinanceRecord[]>([]);

  const loadRecords = async () => {
    const fetchedData = await fetchRecords("bill"); // ✅ Uses generic fetchRecords
    setData(fetchedData);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent 
          title="Contas a Pagar" 
          data={data} 
          type="bill" 
          onRecordUpdated={loadRecords} // ✅ Uses generic loadRecords
        />
      </div>
    </div>
  );
}
