"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, LayoutGrid, User, PlusCircle } from "lucide-react";
import TableComponent from "@/components/TableContas";
import Sidebar from "@/components/Sidebar";


interface Income {
  id: number;
  person: string;
  description: string;
  date_due: string;
  value: string;
  doc_number?: string;
  event?: string | null;
  status: "em aberto" | "pago" | "vencido";
}

type FiltersType = {
  startDate: string;
  endDate: string;
  person: string;
  description: string;
  status: string[];
  minValue: string;
  maxValue: string;
};

interface Event {
  id: number;
  event_name: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Page() {
  const [data, setData] = useState<Income[]>([]);

  const fetchIncomes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/orders/incomes/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar recebimentos");
      }

      const result = await response.json();
      setData(result.incomes);
    } catch (error) {
      console.error("Erro ao buscar recebimentos:", error);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent
          title="Contas a Pagar" 
          data={data} 
          type="income" 
          onRecordUpdated={fetchIncomes} // ✅ Passes the function reference
        />
      </div>
    </div>
  );
}
