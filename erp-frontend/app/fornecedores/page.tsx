"use client";

import { useState, useEffect } from "react";
import TableResources from "@/components/clients/TableResources";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadSuppliers = async (activeFilters: FiltersClientType, page = 1) => {
    const response = await fetchResources("suppliers", activeFilters, page);
    setData(response.results);
    setTotalCount(response.count);
  };

  useEffect(() => {
    loadSuppliers(filters, currentPage);
  }, [filters, currentPage]);

  return (
    <div className="flex">
      <div className="flex-1 p-6">
        <TableResources
          resourceType="suppliers"
          data={data}
          title="Fornecedores"
          filters={filters}
          setFilters={setFilters}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalCount={totalCount}
          onResourceCreated={() => loadSuppliers(filters, currentPage)}
        />
      </div>
    </div>
  );
}
