"use client";

import { useState, useEffect } from "react";
import TableResources from "@/components/clients/TableResources";
import Sidebar from "@/components/Sidebar";
import { fetchResources } from "@/services/resources";
import { Resource, FiltersClientType } from "@/types/types";

export default function ClientsPage() {
  const [data, setData] = useState<Resource[]>([]);
  const [filters, setFilters] = useState<FiltersClientType>({
    name: "",
    cpf_cnpj: "",
    email: "",
    telephone: "",
  });

  const loadClients = async (activeFilters: FiltersClientType) => {
    const clientsData = await fetchResources("clients", activeFilters);
    setData(clientsData);
  };

  useEffect(() => {
    loadClients(filters);
  }, [filters]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableResources
          resourceType="clients"
          data={data}
          title="Clientes"
          filters={filters}
          setFilters={setFilters}
          onResourceCreated={() => loadClients(filters)}
        />
      </div>
    </div>
  );
}