"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/lancamentos/TableLancamentos";
import { fetchOrders } from "@/services/lancamentos";

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

  const loadOrders = async () => {
    const ordersData = await fetchOrders();
    setData(ordersData);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent data={data} title="Lançamentos" onOrderUpdated={loadOrders} />
      </div>
    </div>
  );
}
