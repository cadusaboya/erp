"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import CreateLancamentoDialog from "@/components/CreateLancamentoDialog";
import EditOrderDialog from "./EditOrderDialog";
import Filters from "./FiltersDialog";

interface Order {
  id: number;
  type: string;
  person: string;
  description: string;
  date: string;
  doc_number: string;
  value: string;
  event?: string | null;
}
  
  type FiltersType = {
    type: string[];
    startDate: string;
    endDate: string;
    person: string;
    description: string;
    minValue: string;
    maxValue: string;
  };

  interface TableComponentProps {
    data: Order[];
    title: string;
    onOrderUpdated: () => void;
  }

const TableComponent: React.FC<TableComponentProps> = ({ data, title, onOrderUpdated }) => {
    const [createOpen, setCreateOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filters, setFilters] = useState<FiltersType>({
        startDate: "",
        endDate: "",
        person: "",
        description: "",
        type: ["Despesa", "Receita"],
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
          type: ["Despesa", "Receita"],
          minValue: "",
          maxValue: ""
        });
        localStorage.removeItem("savedFilters");
      };
      
      const filteredData = (data && data.length > 0) ? data.filter((order) => {
        return (
          (!filters.startDate || new Date(order.date) >= new Date(filters.startDate)) &&
          (!filters.endDate || new Date(order.date) <= new Date(filters.endDate)) &&
          (!filters.person || order.person.toLowerCase().includes(filters.person.toLowerCase())) &&
          (!filters.description || order.description.toLowerCase().includes(filters.description.toLowerCase())) &&
          (filters.type.length === 0 || filters.type.includes(order.type)) &&
          (!filters.minValue || parseFloat(order.value) >= parseFloat(filters.minValue)) &&
          (!filters.maxValue || parseFloat(order.value) <= parseFloat(filters.maxValue))
        );
      }) : []; // 👈 Returns an empty array instead of undefined
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleEditClick = (order: Order) => {
      setSelectedOrder(order);
      setEditOpen(true);
    };
  
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex gap-4">
            <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
            <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
              <PlusCircle size={18} /> Novo Lançamento
            </Button>
          </div>
        </div>
  
        {/* Dialog for Advanced Filters */}
      <Filters
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        filterOptions={["despesa", "receita"]} // Order options
        filterKey="type" // Tells the component to use 'type'
      />



        <CreateLancamentoDialog 
        open={createOpen} 
        onClose={() => setCreateOpen(false)} 
        onOrderCreated={onOrderUpdated} 
      />

        <EditOrderDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onOrderUpdated={onOrderUpdated} // Function to refresh data
          order={selectedOrder} // Order object
        />

  
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Pessoa</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Número do Documento</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {paginatedData.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.type}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.person}</TableCell>
                <TableCell>{order.description}</TableCell>
                <TableCell>{order.doc_number}</TableCell>
                <TableCell> R$ {order.value}</TableCell>
                <TableCell>
                  <Button variant="outline" onClick={() => handleEditClick(order)}>Editar</Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        <div className="flex justify-center mt-4">
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