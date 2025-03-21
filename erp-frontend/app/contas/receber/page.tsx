"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/contas/TableContas";
import Sidebar from "@/components/Sidebar";
import { fetchRecords } from "@/services/records";


interface FinanceRecord {
  id?: number;
  person_name: string;
  person: number; // used by the form
  description: string;
  date_due: string;
  value: string;
  doc_number?: string;
  event?: string | null;
  status: "em aberto" | "pago" | "vencido";
  bank?: number;
  bank_name: string;
  payment_doc_number?: number;
}

export default function Page() {
  const [data, setData] = useState<FinanceRecord[]>([]);

  const loadRecords = async () => {
    const fetchedData = await fetchRecords("income"); // ✅ Uses generic fetchRecords
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
          title="Contas a Receber" 
          data={data} 
          type="income" 
          onRecordUpdated={loadRecords} // ✅ Passes the function reference
        />
      </div>
    </div>
  );
}
