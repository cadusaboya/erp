"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/lancamentos/TableLancamentos";
import { fetchOrders } from "@/services/lancamentos";
import { FinanceRecord } from "@/types/types";

export default function Page() {
  const [data, setData] = useState<FinanceRecord[]>([]);

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
