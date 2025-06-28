"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import EditContaDialog from "@/components/contas/EditContaDialog";
import Filters from "@/components/Filters";
import CreateContaDialog from "@/components/contas/CreateContaDialog";
import { MoreVertical, PlusCircle } from "lucide-react";
import { FinanceRecord, FilterFinanceRecordType, PaymentCreatePayload, PaymentRecord } from "@/types/types";
import { PaymentsDialog } from "@/components/lancamentos/ViewMoreDialog";
import { fetchPayments, createPayment } from "@/services/lancamentos";
import CreatePaymentDialog from "../lancamentos/CreatePaymentDialog";
import { deleteRecord } from "@/services/records";
import { formatCurrencyBR } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axios";
import { toast } from "sonner"; // at the top

interface BankOption {
  id: number;
  name: string;
}

interface TableComponentProps {
  data: FinanceRecord[];
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  title: string;
  type: "bill" | "income";
  onRecordUpdated: () => void;
  filters: FilterFinanceRecordType;
  setFilters: (filters: FilterFinanceRecordType) => void;
  bankOptions: BankOption[];
}

const TableComponent: React.FC<TableComponentProps> = ({
  data,
  totalCount,
  currentPage,
  setCurrentPage,
  title,
  type,
  onRecordUpdated,
  filters,
  setFilters,
  bankOptions,
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [recordToPay, setRecordToPay] = useState<FinanceRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleEditClick = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setEditOpen(true);
  };

  const handlePaymentsClick = async (record: FinanceRecord) => {
    const filters = {
      ...(type === "bill" ? { bill_id: record.id } : { income_id: record.id }),
      status: ["pago", "agendado"],
    };
    const paymentData = await fetchPayments(filters);
    setPayments(paymentData.results || []);
    setSelectedRecord(record);
    setPaymentsDialogOpen(true);
  };

  const handleNewPayment = (record: FinanceRecord) => {
    setRecordToPay(record);
    setCreatePaymentOpen(true);
  };

  const handleDelete = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const applyFilters = (newFilters: FilterFinanceRecordType) => {
    setFilters(newFilters);
    setFiltersOpen(false);
    setCurrentPage(1);
  };

  const markPaymentAsPaid = async (id: number, date: string) => {
    // Espera-se que date esteja no formato "DD/MM/YY"
    const [day, month, yearShort] = date.split("/");
    const fullYear = parseInt(yearShort, 10) < 50 ? "20" + yearShort : "19" + yearShort; // você pode ajustar conforme necessário
  
    const isoDate = `${fullYear}-${month}-${day}`; // resultado: "2025-05-30"
  
    await api.patch(`/payments/payments/${id}/marcar-pago/`, { date: isoDate });
    setPaymentsDialogOpen(false);
    onRecordUpdated();
  };
  

  const handleSubmitPayment = async (formData: Record<string, string>) => {
    if (!recordToPay) return;
  
    const payload: PaymentCreatePayload = {
      value: formData.value,
      date: formData.date,                      // sempre obrigatório
      doc_number: formData.doc_number,
      description: formData.description,
      status: formData.status as "pago" | "agendado", // precisa incluir!
      bank: parseInt(formData.bank),
      ...(type === "bill" ? { bill_id: recordToPay.id } : { income_id: recordToPay.id }),
    };
    
    try {
      const res = await createPayment(payload);
    
      if (res?.id) {
        toast.success("Pagamento criado com sucesso!", {
          description: `ID: ${res.id}`,
        });
        onRecordUpdated();
      } else {
        toast.error("Criar Pagamento Falhou!", {
          description: `Backend não retornou ID`,
        });
      }
    } catch (error) {
        toast.error("Criar Pagamento Falhou!", {
          description: error instanceof Error ? error.message : "Erro desconhecido",
        });
    }
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
            
              if (val === "") {
                setFilters({ startDate: "2023-01-01", endDate: "", person: "", description: "", id: undefined, status: ["em aberto", "vencido", "parcial", "agendado"], minValue: "", maxValue: "" })
              } else {
                const updatedStatus = filters.status?.includes("pago")
                  ? filters.status
                  : [...(filters.status || []), "pago"];
            
                setFilters({
                  ...filters,
                  id: parseInt(val),
                  status: updatedStatus,
                });
              }
            }}
            
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCurrentPage(1);
                onRecordUpdated();
              }
            }}
          />
          <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <PlusCircle size={18} /> {type === "bill" ? "Nova Conta" : "Novo Recebimento"}
          </Button>
        </div>
      </div>

      <Filters<FilterFinanceRecordType>
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={applyFilters}
        clearFilters={() =>
          setFilters({ startDate: "", endDate: "", person: "", description: "", id: undefined, status: ["em aberto", "vencido", "parcial", "agendado"], minValue: "", maxValue: "" })
        }
        filterFields={[
          { key: "startDate", type: "date", label: "Data Inicial", placeholder: "Data Inicial" },
          { key: "endDate", type: "date", label: "Data Final", placeholder: "Data Final" },
          { key: "person", type: "text", label: "Pessoa", placeholder: "Pessoa" },
          { key: "description", type: "text", label: "Descrição", placeholder: "Descrição" },
          { key: "status", type: "checkboxes", label: "Tipo", options: ["em aberto", "vencido", "parcial", "pago", "agendado"] },
        ]}
      />

      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableCell className="w-1/18 min-w-[50px]">ID</TableCell>
            <TableCell className="w-2/14 min-w-[100px]">Data de Vencimento</TableCell>
            <TableCell className="w-4/14 min-w-[140px]">{type === "bill" ? "Fornecedor" : "Cliente"}</TableCell>
            <TableCell className="w-4/14 min-w-[180px]">Descrição</TableCell>
            <TableCell className="w-1/14 min-w-[120px]">Doc. Núm.</TableCell>
            <TableCell className="w-1/10 min-w-[120px]">Status</TableCell>
            <TableCell className="w-1/14 min-w-[100px]">Valor</TableCell>
            <TableCell className="w-1/14 min-w-[60px] text-center">Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {data.map((record) => (
            <TableRow key={`${record.id}-${record.status}`} className="h-[56px] align-middle">
              <TableCell className="w-1/16 min-w-[50px]">{record.id || "N/A"}</TableCell>
              <TableCell className="w-2/14 min-w-[100px]">
                {new Date(record.date_due + "T00:00:00").toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              </TableCell>
              <TableCell className="w-4/14 min-w-[140px]">
                <div className="truncate" title={record.person_name}>{record.person_name}</div>
              </TableCell>
              <TableCell className="w-4/14 min-w-[180px]">
                <div className="truncate" title={record.description}>{record.description}</div>
              </TableCell>
              <TableCell className="w-1/14 min-w-[120px]">{record.doc_number || "N/A"}</TableCell>
              <TableCell className="w-1/10 min-w-[120px]">
                <span className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                  record.status === "vencido" ? "bg-red-100 text-red-600" :
                  record.status === "pago" ? "bg-green-100 text-green-600" :
                  "bg-yellow-100 text-yellow-600"
                }`}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </TableCell>
              <TableCell className="w-1/14 min-w-[100px]">
                {record.status === "parcial"
                  ? formatCurrencyBR(record.remaining_value ?? 0)
                  : formatCurrencyBR(record.value ?? 0)}
              </TableCell>
              <TableCell className="w-1/14 min-w-[60px] text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleEditClick(record), 0)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeout(() => handlePaymentsClick(record), 0)}>Pagamentos</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleNewPayment(record), 0)}>Pagar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleDelete(record), 0)}>Excluir</DropdownMenuItem>
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

      {/* Dialogs */}
      <EditContaDialog open={editOpen} onClose={() => setEditOpen(false)} onRecordUpdated={onRecordUpdated} record={selectedRecord} type={type} />
      <CreateContaDialog open={createOpen} onClose={() => setCreateOpen(false)} onRecordCreated={onRecordUpdated} type={type} />
      <PaymentsDialog
        open={paymentsDialogOpen}
        onClose={() => setPaymentsDialogOpen(false)}
        payments={payments}
        totalValue={selectedRecord?.value || "0.00"}
        onMarkAsPaid={async (paymentId, date) => {
          await markPaymentAsPaid(paymentId, date); // sua função para PATCH
        }}
      />
      <CreatePaymentDialog
        open={createPaymentOpen}
        onClose={() => setCreatePaymentOpen(false)}
        onSubmit={handleSubmitPayment}
        defaultValue={
                      recordToPay?.status === "parcial"
                        ? recordToPay?.remaining_value?.toString() || ""
                        : recordToPay?.value?.toString() || ""
                    }
        bankOptions={bankOptions.map((bank) => ({ label: bank.name, value: String(bank.id) }))}
      />


      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta conta será excluída permanentemente e não poderá ser recuperada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              const id = selectedRecord?.id;
              if (id === undefined) return;
              await deleteRecord(type, id);
              setDeleteOpen(false);
              setSelectedRecord(null);
              onRecordUpdated();
            }}>
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TableComponent;
