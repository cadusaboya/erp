"use client";

import { useState, useEffect } from "react";
import TableResources from "@/components/clients/TableResources";
import Sidebar from "@/components/Sidebar";
import { fetchResources } from "@/services/resources";
import { Resource } from "@/types/types"

export default function Page() {
  const [data, setData] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadClients = async () => {
    const clientsData = await fetchResources("clients");
    setData(clientsData);
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        {loading ? (
          <p>Carregando clientes...</p>
        ) : (
          <TableResources resourceType="clients" data={data} title="Clientes" onResourceCreated={loadClients} />
        )}
      </div>
    </div>
  );
}
