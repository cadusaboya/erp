"use client";

import { useState, useEffect } from "react";
import TableResources from "@/components/clients/TableResources";
import Sidebar from "@/components/Sidebar";
import { fetchResources } from "@/services/resources";

interface Supplier {
  id: number;
  name: string;
  email: string;
  telephone: string;
  address: string;
  cpf_cnpj: string;
}

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSuppliers = async () => {
    const suppliersData = await fetchResources("suppliers");
    setData(suppliersData);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        {loading ? (
          <p>Carregando fornecedores...</p>
        ) : (
          <TableResources
            resourceType="suppliers"
            data={data}
            title="Fornecedores"
            onResourceCreated={loadSuppliers}
          />
        )}
      </div>
    </div>
  );
}
