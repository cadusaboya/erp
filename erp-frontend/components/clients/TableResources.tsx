"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PlusCircle, Filter } from "lucide-react";
import EditResourceDialog from "@/components/clients/EditResourceDialog";
import CreateResourceDialog from "./CreateResourceDialog";
import FiltersDialogClient from "@/components/FiltersResourcesDialog"; // Import your filters dialog
import { Resource } from "@/types/types";

type ResourceType = "clients" | "suppliers";

interface TableResourcesProps {
  resourceType: ResourceType;
  data: Resource[];
  title: string;
  onResourceCreated: () => void;
}

const TableResources: React.FC<TableResourcesProps> = ({
  resourceType,
  data,
  title,
  onResourceCreated,
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const [filters, setFilters] = useState({
    name: "",
    cpf_cnpj: "",
    email: "",
    telephone: "",
  });

  const handleEditClick = (resource: Resource) => {
    setSelectedResource(resource);
    setEditOpen(true);
  };

  const filteredData = data.filter((resource) => {
    return (
      (!filters.name || resource.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.cpf_cnpj || resource.cpf_cnpj.includes(filters.cpf_cnpj)) &&
      (!filters.email || resource.email.toLowerCase().includes(filters.email.toLowerCase())) &&
      (!filters.telephone || resource.telephone.includes(filters.telephone))
    );
  });

  const resourceLabel = resourceType === "clients" ? "Cliente" : "Fornecedor";

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setFiltersOpen(true)}>
            <Filter size={18} /> Filtros
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle size={18} /> Novo {resourceLabel}
          </Button>
        </div>
      </div>

      {/* Filters Dialog */}
      <FiltersDialogClient
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={setFilters}
        clearFilters={() =>
          setFilters({ name: "", cpf_cnpj: "", email: "", telephone: "" })
        }
      />

      {/* Create / Edit Dialogs */}
      <CreateResourceDialog
        resourceType={resourceType}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onResourceCreated={onResourceCreated}
      />
      <EditResourceDialog
        resourceType={resourceType}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onResourceUpdated={onResourceCreated}
        resource={selectedResource}
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Endereço</TableCell>
            <TableCell>CPF/CNPJ</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {filteredData.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell>{resource.id}</TableCell>
              <TableCell>{resource.name}</TableCell>
              <TableCell>{resource.email}</TableCell>
              <TableCell>{resource.telephone}</TableCell>
              <TableCell>{resource.address}</TableCell>
              <TableCell>{resource.cpf_cnpj}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => handleEditClick(resource)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TableResources;
