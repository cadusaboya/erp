"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PaymentRecord, FilterPaymentType } from "@/types/types";
import Filters from "@/components/Filters";
import EditDialog from "../EditDialog";
import { updatePayment } from "@/services/lancamentos";

interface TableComponentProps {
  data: PaymentRecord[];
  title: string;
  onOrderUpdated: () => void;
  filters: FilterPaymentType;
  setFilters: (filters: FilterPaymentType) => void;
  bankOptions: string[];
}

const TableComponent: React.FC<TableComponentProps> = ({ data, title, onOrderUpdated, filters, setFilters, bankOptions }) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const itemsPerPage = 13;

  const applyFilters = (newFilters: FilterPaymentType) => {
    setFilters(newFilters);
    setFiltersOpen(false);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEdit = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setEditDialogOpen(true);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4">
          <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
        </div>
      </div>

      {/* Filters */}
      <Filters<FilterPaymentType>
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={applyFilters}
        clearFilters={() =>
          setFilters({
            startDate: "",
            endDate: "",
            person: "",
            type: ["Despesa", "Receita"],
            minValue: "",
            maxValue: "",
            bank_name: [],
          })
        }
        filterFields={[
          { key: "startDate", type: "date", label: "Data Inicial", placeholder: "Data Inicial" },
          { key: "endDate", type: "date", label: "Data Final", placeholder: "Data Final" },
          { key: "person", type: "text", label: "Pessoa", placeholder: "Pessoa" },
          { key: "minValue", type: "number", label: "Valor Mínimo", placeholder: "Valor Mínimo" },
          { key: "maxValue", type: "number", label: "Valor Máximo", placeholder: "Valor Máximo" },
          { key: "bank_name", type: "checkboxes", label: "Banco", options: bankOptions },
          { key: "type", type: "checkboxes", label: "Tipo", options: ["Despesa", "Receita"] },
        ]}
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Tipo</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Pessoa</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Doc. de Pgto</TableCell>
            <TableCell>Banco</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedData.map((payment) => (
            <TableRow key={`${payment.id}`}>
              <TableCell>{payment.content_type === "bill" ? "Despesa" : "Receita"}</TableCell>
              <TableCell>{payment.date}</TableCell>
              <TableCell>{payment.person_name}</TableCell>
              <TableCell>{payment.description}</TableCell>
              <TableCell>{payment.doc_number}</TableCell>
              <TableCell>{payment.bank_name}</TableCell>
              <TableCell>R$ {payment.value}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => handleEdit(payment)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          ⬅️
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          ➡️
        </button>
      </div>

      {/* EditDialog */}
      {selectedPayment && (
        <EditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          title="Editar Pagamento"
          defaultValues={{
            value: selectedPayment.value,
            date: selectedPayment.date,
            description: selectedPayment.description || "",
            doc_number: selectedPayment.doc_number,
            bank: selectedPayment.bank?.toString() || "",
          }}
          fields={[
            { key: "value", type: "number", label: "Valor", placeholder: "R$ 0,00" },
            { key: "date", type: "date", label: "Data" },
            { key: "description", type: "text", label: "Descrição" },
            { key: "doc_number", type: "text", label: "Nº do comprovante" },
            {
              key: "bank",
              type: "select",
              label: "Banco",
              options: bankOptions.map((bank, idx) => ({ label: bank, value: String(idx + 1) })),
            },
          ]}
          onSubmit={async (formData) => {
            if (!selectedPayment) return;
            await updatePayment(selectedPayment.id, formData);
            setEditDialogOpen(false);
            onOrderUpdated();
          }}
        />
      )}
    </div>
  );
};

export default TableComponent;
