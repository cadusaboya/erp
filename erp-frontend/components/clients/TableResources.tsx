"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PlusCircle, Filter } from "lucide-react";
import EditResourceDialog from "@/components/clients/EditResourceDialog";
import CreateResourceDialog from "./CreateResourceDialog";
import FiltersDialog from "@/components/Filters";
import { Resource, FiltersClientType } from "@/types/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { deleteResource } from "@/services/resources";

// ✅ Suporte à paginação server-side
interface TableResourcesProps {
  resourceType: "clients" | "suppliers";
  data: Resource[];
  title: string;
  filters: FiltersClientType;
  setFilters: (filters: FiltersClientType) => void;
  onResourceCreated: () => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalCount: number;
}

const TableResources: React.FC<TableResourcesProps> = ({
  resourceType,
  data,
  title,
  filters,
  setFilters,
  onResourceCreated,
  currentPage,
  setCurrentPage,
  totalCount,
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleEditClick = (resource: Resource) => {
    setSelectedResource(resource);
    setEditOpen(true);
  };

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (resourceToDelete) {
      await deleteResource(resourceType, resourceToDelete.id);
      setDeleteDialogOpen(false);
      onResourceCreated();
    }
  };

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

      <FiltersDialog<FiltersClientType>
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1); // 👈 reset page when applying filters
        }}
        clearFilters={() =>
          setFilters({ name: "", cpf_cnpj: "", email: "", telephone: "" })
        }
        filterFields={[
          { key: "name", type: "text", label: "Nome", placeholder: "Nome" },
          { key: "cpf_cnpj", type: "text", label: "CPF/CNPJ", placeholder: "CPF ou CNPJ" },
          { key: "email", type: "text", label: "Email", placeholder: "Email" },
          { key: "telephone", type: "text", label: "Telefone", placeholder: "Telefone" },
        ]}
      />

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
          {data.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell>{resource.id}</TableCell>
              <TableCell>{resource.name}</TableCell>
              <TableCell>{resource.email}</TableCell>
              <TableCell>{resource.telephone}</TableCell>
              <TableCell>{resource.address}</TableCell>
              <TableCell>{resource.cpf_cnpj}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleEditClick(resource), 0)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setTimeout(() => handleDeleteClick(resource), 0)}
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <Pagination className="mt-4 justify-center">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {currentPage > 2 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <span className="px-2">...</span>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationLink isActive>{currentPage}</PaginationLink>
          </PaginationItem>

          {currentPage < totalPages - 1 && (
            <>
              <PaginationItem>
                <span className="px-2">...</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.max(currentPage + 1, 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não poderá ser desfeita. O dado será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Sim, excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TableResources;
