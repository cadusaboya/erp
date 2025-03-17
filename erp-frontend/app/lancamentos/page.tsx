"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/lancamentos/TableLancamentos";


const API_BASE_URL = "http://127.0.0.1:8000";

interface Order {
  id: number;
  type: string;
  person: string;
  description: string;
  date: string;
  doc_number: string;
  value: string;
  event?: string | null;
}


export default function Page() {
  const [data, setData] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/orders/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar ordens de pagamento");
      }

      const result = await response.json();
      setData(result.orders);
    } catch (error) {
      console.error("Erro ao buscar ordens de pagamento:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent data={data} title="Lançamentos" onOrderUpdated={fetchOrders} />
      </div>
    </div>
  );
}
