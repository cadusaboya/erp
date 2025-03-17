"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/clients/tableClientes";
import Sidebar from "@/components/Sidebar";
import { fetchClients } from "@/services/clientes";

interface Client {
  id: number;
  name: string;
  email: string;
  telephone: string;
  address: string;
  cpf_cnpj: string;
}

export default function Page() {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadClients = async () => {
    const clientsData = await fetchClients();
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
          <TableComponent data={data} title="Clientes" onClientCreated={loadClients} />
        )}
      </div>
    </div>
  );
}
