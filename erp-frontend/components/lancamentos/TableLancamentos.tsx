"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { FilterFinanceRecordType, FinanceRecord } from "@/types/types"
import Filters from "@/components/Filters";

  interface TableComponentProps {
    data: FinanceRecord[];
    title: string;
    onOrderUpdated: () => void;
    filters: FilterFinanceRecordType;
    setFilters: (filters: FilterFinanceRecordType) => void; // ✅ Receive filters from parent
  }

const TableComponent: React.FC<TableComponentProps> = ({ data, title, onOrderUpdated, filters, setFilters }) => {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 13;
    
      const applyFilters = (newFilters: FilterFinanceRecordType) => {
        setFilters(newFilters);
        setFiltersOpen(false);
        setCurrentPage(1);
      };
  
      
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex gap-4">
            <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
          </div>
        </div>
  
        <Filters<FilterFinanceRecordType>
          filters={filters}
          setFilters={setFilters}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          applyFilters={applyFilters}
          clearFilters={() => setFilters({
            startDate: "",
            endDate: "",
            person: "",
            description: "",
            type: ["Despesa", "Receita"],
            minValue: "",
            maxValue: "",
            bank_name: ["Bradesco", "Caixa", "Itau"]
          })}
          filterFields={[
            { key: "startDate", type: "date", label: "Data Inicial", placeholder: "Data Inicial" },
            { key: "endDate", type: "date", label: "Data Final", placeholder: "Data Final" },
            { key: "person", type: "text", label: "Pessoa", placeholder: "Pessoa" },
            { key: "description", type: "text", label: "Descrição", placeholder: "Descrição" },
            { key: "minValue", type: "number", label: "Valor Mínimo", placeholder: "Valor Mínimo" },
            { key: "maxValue", type: "number", label: "Valor Máximo", placeholder: "Valor Máximo" },
            { key: "bank_name", type: "checkboxes", label: "Banco", options: ["Bradesco", "Caixa", "Itau"] },
            { key: "type", type: "checkboxes", label: "Tipo", options: ["Despesa", "Receita"] },
          ]}
        />
  
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Pessoa</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Número do Doc.</TableCell>
              <TableCell>Doc. de Pgto</TableCell>
              <TableCell>Banco</TableCell>
              <TableCell>Valor</TableCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {paginatedData.map((order) => (
              <TableRow key={`${order.type}-${order.id}`}>
                <TableCell>{order.type}</TableCell>
                <TableCell>{order.date_due}</TableCell>
                <TableCell>{order.person_name}</TableCell>
                <TableCell>{order.description}</TableCell>
                <TableCell>{order.doc_number}</TableCell>
                <TableCell>{order.payment_doc_number}</TableCell>
                <TableCell>{order.bank_name}</TableCell>
                <TableCell> R$ {order.value}</TableCell>
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