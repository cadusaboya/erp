"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import EditContaDialog from "@/components/contas/EditContaDialog"
import Filters from "@/components/FiltersDialog";
import CreateContaDialog from "@/components/contas/CreateContaDialog"
import { PlusCircle } from "lucide-react";

interface FinanceRecord {
  id: number;
  person: number;
  person_name: string;
  description: string;
  date_due: string;
  value: string;
  doc_number?: string;
  event?: string | null;
  status: "em aberto" | "pago" | "vencido";
}

type FiltersType = {
  startDate: string;
  endDate: string;
  person: string;
  description: string;
  status: string[];
  minValue: string;
  maxValue: string;
};

interface TableComponentProps {
  data: FinanceRecord[];
  title: string;
  type: "bill" | "income"; // Determines if it's for Bills or Incomes
  onRecordUpdated: () => void;
}

const TableComponent: React.FC<TableComponentProps> = ({ data, title, type, onRecordUpdated }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltersType>({
    startDate: "",
    endDate: "",
    person: "",
    description: "",
    status: ["em aberto", "vencido", "pago"],
    minValue: "",
    maxValue: "",
  });

  const itemsPerPage = 13;

  useEffect(() => {
    localStorage.setItem("savedFilters", JSON.stringify(filters));
  }, [filters]);

  const applyFilters = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setFiltersOpen(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      person: "",
      description: "",
      status: ["em aberto", "vencido", "pago"],
      minValue: "",
      maxValue: "",
    });
    localStorage.removeItem("savedFilters");
  };

  const filteredData = data.filter((record) => {
    return (
      (!filters.startDate || new Date(record.date_due) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(record.date_due) <= new Date(filters.endDate)) &&
      (!filters.person || record.person_name.toLowerCase().includes(filters.person.toLowerCase())) &&
      (!filters.description || record.description.toLowerCase().includes(filters.description.toLowerCase())) &&
      (filters.status.length === 0 || filters.status.includes(record.status)) &&
      (!filters.minValue || parseFloat(record.value) >= parseFloat(filters.minValue)) &&
      (!filters.maxValue || parseFloat(record.value) <= parseFloat(filters.maxValue))
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setEditOpen(true);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4">
          <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <PlusCircle size={18} /> {type === "bill" ? "Nova Conta" : "Novo Recebimento"}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Filters
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        filterOptions={["pago", "em aberto", "vencido"]} // Order options
        filterKey="status" // Tells the component to use 'type'
      />


      <EditContaDialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        onRecordUpdated={onRecordUpdated} 
        record={selectedRecord} 
        type={type} // ✅ Dynamic for "bill" or "income"
      />

      <CreateContaDialog 
        open={createOpen} 
        onClose={() => setCreateOpen(false)} 
        onRecordCreated={onRecordUpdated} 
        type={type} 
      />

      {/* Table with Pagination */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Data de Vencimento</TableCell>
            <TableCell>Pessoa</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Número do Documento</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedData.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.date_due}</TableCell>
              <TableCell>{record.person_name}</TableCell>
              <TableCell>{record.description}</TableCell>
              <TableCell>{record.doc_number || "N/A"}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                    record.status === "vencido"
                      ? "bg-red-100 text-red-600"
                      : record.status === "pago"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>R$ {record.value}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => handleEditClick(record)}>Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <div className="flex justify-center mt-4 gap-4">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          ⬅️
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          ➡️
        </button>
      </div>
    </div>
  );
};

export default TableComponent;
