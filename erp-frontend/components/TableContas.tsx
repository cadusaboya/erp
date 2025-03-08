"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import CreateBillDialog from "@/components/CreateBillDialog";
import { PlusCircle } from "lucide-react";
import Filters from "@/components/FiltersDialog";
import EditBillDialog from "@/components/EditBillDialog";

interface Bill {
  id: number;
  person: string;
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

const TableComponent: React.FC<{ data: Bill[]; title: string; onBillCreated: () => void }> = ({ data, title, onBillCreated }) => {
  const [open, setOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltersType>({
      startDate: "",
      endDate: "",
      person: "",
      description: "",
      status: ["em aberto", "vencido", "pago"],
      minValue: "",
      maxValue: ""
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
      maxValue: ""
    });
    localStorage.removeItem("savedFilters");
  };
  
  const filteredData = data.filter((bill) => {
    return (
      (!filters.startDate || new Date(bill.date_due) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(bill.date_due) <= new Date(filters.endDate)) &&
      (!filters.person || bill.person.toLowerCase().includes(filters.person.toLowerCase())) &&
      (!filters.description || bill.description.toLowerCase().includes(filters.description.toLowerCase())) &&
      (filters.status.length === 0 || filters.status.includes(bill.status)) &&  // <-- Ensure this condition is added
      (!filters.minValue || parseFloat(bill.value) >= parseFloat(filters.minValue)) &&
      (!filters.maxValue || parseFloat(bill.value) <= parseFloat(filters.maxValue))
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (bill: Bill) => {
    setSelectedBill(bill); // Set the selected bill to edit
    setEditOpen(true); // Open the dialog
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4">
          <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <PlusCircle size={18} /> Nova Conta
          </Button>
        </div>
      </div>

    {/* Dialogs */}
      <Filters filters={filters} setFilters={setFilters} open={filtersOpen} onClose={() => setFiltersOpen(false)} applyFilters={applyFilters} clearFilters={clearFilters} />

      <CreateBillDialog 
        open={open} 
        onClose={() => setOpen(false)} 
        onBillCreated={onBillCreated} 
        />

        <EditBillDialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        onBillUpdated={onBillCreated} 
        bill={selectedBill}
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
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedData.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{bill.date_due}</TableCell>
              <TableCell>{bill.person}</TableCell>
              <TableCell>{bill.description}</TableCell>
              <TableCell>{bill.doc_number || "N/A"}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                    bill.status === "vencido"
                      ? "bg-red-100 text-red-600"
                      : bill.status === "pago"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>R$ {bill.value}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => handleEditClick(bill)}>Editar</Button>
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
