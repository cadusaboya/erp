"use client";

import { useState, useEffect } from "react";
import TableResources from "@/components/clients/TableResources";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadClients = async (activeFilters: FiltersClientType, page = 1) => {
    const response = await fetchResources("clients", activeFilters, page);
    setData(response.results);
    setTotalCount(response.count);
  };

  useEffect(() => {
    loadClients(filters, currentPage);
  }, [filters, currentPage]);

  return (
    <div className="flex">
      <div className="flex-1 p-6">
        <TableResources
          resourceType="clients"
          data={data}
          title="Clientes"
          filters={filters}
          setFilters={setFilters}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalCount={totalCount}
          onResourceCreated={() => loadClients(filters, currentPage)}
        />
      </div>
    </div>
  );
}
