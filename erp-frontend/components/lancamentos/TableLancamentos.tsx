"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PaymentRecord, FilterPaymentType } from "@/types/types";
import Filters from "@/components/Filters";
import EditDialog from "../EditDialog";
import { updatePayment } from "@/services/lancamentos";
import { formatCurrencyBR } from "@/lib/utils";
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
import { Input } from "@/components/ui/input";
import { deletePayment } from "@/services/lancamentos";

interface BankOption {
  id: number;
  name: string;
}

interface TableComponentProps {
  data: PaymentRecord[];
  title: string;
  onOrderUpdated: () => void;
  filters: FilterPaymentType;
  setFilters: (filters: FilterPaymentType) => void;
  bankOptions: BankOption[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalCount: number;
}

const TableComponent: React.FC<TableComponentProps> = ({
  data,
  title,
  onOrderUpdated,
  filters,
  setFilters,
  bankOptions,
  currentPage,
  setCurrentPage,
  totalCount,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const applyFilters = (newFilters: FilterPaymentType) => {
    setFilters(newFilters);
    setFiltersOpen(false);
    setCurrentPage(1);
  };

  const handleEdit = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setEditDialogOpen(true);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4 items-center">
          <Input
            type="number"
            placeholder="ID"
            className="w-[120px]"
            value={filters.id ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setFilters({ ...filters, id: val === "" ? undefined : parseInt(val) });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCurrentPage(1);
                onOrderUpdated(); // ou função de busca
              }
            }}
          />
          <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
        </div>
      </div>

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
            id: undefined
          })
        }
        filterFields={[
          { key: "startDate", type: "date", label: "Data Inicial", placeholder: "Data Inicial" },
          { key: "endDate", type: "date", label: "Data Final", placeholder: "Data Final" },
          { key: "person", type: "text", label: "Pessoa", placeholder: "Pessoa" },
          { key: "minValue", type: "number", label: "Valor Mínimo", placeholder: "Valor Mínimo" },
          { key: "maxValue", type: "number", label: "Valor Máximo", placeholder: "Valor Máximo" },
          { key: "bank_name", type: "checkboxes", label: "Banco", options: bankOptions.map(bank => bank.name) },
          { key: "type", type: "checkboxes", label: "Tipo", options: ["Despesa", "Receita"] },
        ]}
      />

      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableCell className="w-1/17 min-w-[40px]">Tipo</TableCell>
            <TableCell className="w-1/17 min-w-[40px]">Data</TableCell>
            <TableCell className="w-4/17 min-w-[180px]">Pessoa</TableCell>
            <TableCell className="w-4/17 min-w-[180px]">Descrição</TableCell>
            <TableCell className="w-1/17 min-w-[120px]">Doc. de Pgto</TableCell>
            <TableCell className="w-1/17 min-w-[100px]">Banco</TableCell>
            <TableCell className="w-1/17 min-w-[100px]">Valor</TableCell>
            <TableCell className="w-1/17 min-w-[60px] text-center">Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {data.map((payment) => (
            <TableRow key={payment.id} className="h-[56px] align-middle">
              <TableCell className="w-1/17 min-w-[40px]">
                {payment.bill_id ? "Despesa" : "Receita"}
              </TableCell>
              <TableCell className="w-1/17 min-w-[40px]">
                {new Date(payment.date + "T00:00:00").toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                })}
              </TableCell>
              <TableCell className="w-4/17 min-w-[180px]">
                <div className="truncate" title={payment.person_name ?? ""}>
                  {payment.person_name}
                </div>
              </TableCell>
              <TableCell className="w-4/17 min-w-[180px]">
                <div className="truncate" title={payment.description}>
                  {payment.description}
                </div>
              </TableCell>
              <TableCell className="w-1/17 min-w-[120px]">{payment.doc_number}</TableCell>
              <TableCell className="w-1/17 min-w-[100px]">{payment.bank_name}</TableCell>
              <TableCell className="w-1/17 min-w-[100px]">{formatCurrencyBR(payment.value)}</TableCell>
              <TableCell className="w-1/17 min-w-[60px] text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleEdit(payment), 0)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setTimeout(() => {
                          setPaymentToDelete(payment);
                          setDeleteDialogOpen(true);
                        }, 0)
                      }
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
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              O dado será excluído permanentemente e não poderá ser restaurado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!paymentToDelete) return;
                await deletePayment(paymentToDelete.id);
                setDeleteDialogOpen(false);
                onOrderUpdated();
              }}
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            bank: String(selectedPayment.bank || ""),
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
              options: bankOptions.map((bank) => ({
                label: bank.name,
                value: String(bank.id),
              })),
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
