"use client";

import { useState, useEffect } from "react";
import TableResources from "@/components/clients/TableResources";
import Sidebar from "@/components/Sidebar";
import { fetchResources } from "@/services/resources";
import { Resource, FiltersClientType } from "@/types/types";

export default function SuppliersPage() {
  const [data, setData] = useState<Resource[]>([]);
  const [filters, setFilters] = useState<FiltersClientType>({
    name: "",
    cpf_cnpj: "",
    email: "",
    telephone: "",
  });

  const loadSuppliers = async (activeFilters: FiltersClientType) => {
    const suppliersData = await fetchResources("suppliers", activeFilters);
    setData(suppliersData);
  };

  useEffect(() => {
    loadSuppliers(filters);
  }, [filters]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableResources
          resourceType="suppliers"
          data={data}
          title="Fornecedores"
          filters={filters}                 // ✅ Inject filters
          setFilters={setFilters}           // ✅ Inject filter setter
          onResourceCreated={() => loadSuppliers(filters)} // reload on create/edit
        />
      </div>
    </div>
  );
}