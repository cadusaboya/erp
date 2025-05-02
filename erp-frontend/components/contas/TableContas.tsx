import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import EditContaDialog from "@/components/contas/EditContaDialog";
import Filters from "@/components/Filters";
import CreateContaDialog from "@/components/contas/CreateContaDialog";
import { MoreVertical, PlusCircle } from "lucide-react";
import { FinanceRecord, FilterFinanceRecordType, PaymentCreatePayload } from "@/types/types";
import { PaymentsDialog } from "@/components/lancamentos/ViewMoreDialog";
import { fetchPayments } from "@/services/lancamentos";
import CreateDialog from "@/components/CreateDialog"; // 👈 new import
import { createPayment } from "@/services/lancamentos"; // 👈 your service to create a payment
import { formatCurrencyBR } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";


interface BankOption {
  id: number;
  name: string;
}

interface TableComponentProps {
  data: FinanceRecord[];
  title: string;
  type: "bill" | "income";
  onRecordUpdated: () => void;
  filters: FilterFinanceRecordType;
  setFilters: (filters: FilterFinanceRecordType) => void;
  bankOptions: BankOption[];
}

const TableComponent: React.FC<TableComponentProps> = ({ data, title, type, onRecordUpdated, filters, setFilters, bankOptions }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false); // 👈 new state
  const [recordToPay, setRecordToPay] = useState<FinanceRecord | null>(null); // 👈 new state

  const itemsPerPage = 13;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setEditOpen(true);
  };

  const handlePaymentsClick = async (record: FinanceRecord) => {
    const filters = type === "bill"
    ? { bill_id: record.id }
    : { income_id: record.id };
  
    const paymentData = await fetchPayments(filters);
    setPayments(paymentData);
    setSelectedRecord(record);
    setPaymentsDialogOpen(true);
  };

  const handleNewPayment = (record: FinanceRecord) => {
    setRecordToPay(record);
    setCreatePaymentOpen(true);
  };

  const applyFilters = (newFilters: FilterFinanceRecordType) => {
    setFilters(newFilters);
    setFiltersOpen(false);
    setCurrentPage(1);
  };

  const handleSubmitPayment = async (formData: Record<string, any>) => {
    if (!recordToPay) return;
  
    const payload: PaymentCreatePayload = {
      ...formData,
      ...(type === "bill" ? { bill_id: Number(recordToPay.id) } : { income_id: Number(recordToPay.id) }),
    };
  
    await createPayment(payload);
    onRecordUpdated();
  };
  
  
  
  

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4">
          <Button onClick={() => setFiltersOpen(true)}>Filtros Avançados</Button>
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <PlusCircle size={18} /> {type === "bill" ? "Nova Conta" : "Novo Recebimento"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Filters<FilterFinanceRecordType>
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={applyFilters}
        clearFilters={() => setFilters({ startDate: "", endDate: "", person: "", description: "", status: ["em aberto", "vencido", "parcial"], minValue: "", maxValue: "" })}
        filterFields={[
          { key: "startDate", type: "date", label: "Data Inicial", placeholder: "Data Inicial" },
          { key: "endDate", type: "date", label: "Data Final", placeholder: "Data Final" },
          { key: "person", type: "text", label: "Pessoa", placeholder: "Pessoa" },
          { key: "description", type: "text", label: "Descrição", placeholder: "Descrição" },
          { key: "minValue", type: "number", label: "Valor Mínimo", placeholder: "Valor Mínimo" },
          { key: "maxValue", type: "number", label: "Valor Máximo", placeholder: "Valor Máximo" },
          { key: "status", type: "checkboxes", label: "Tipo", options: ["em aberto", "vencido", "parcial", "pago"] },
        ]}
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Data de Vencimento</TableCell>
            <TableCell>Pessoa</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Número do Doc.</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedData.map((record) => (
            <TableRow key={`${record.id}-${record.status}`}>
              <TableCell>{new Date(record.date_due).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>{record.person_name}</TableCell>
              <TableCell>{record.description}</TableCell>
              <TableCell>{record.doc_number || "N/A"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-lg text-sm font-semibold ${record.status === "vencido" ? "bg-red-100 text-red-600" : record.status === "pago" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                {record.status === "parcial" ? formatCurrencyBR(record.remaining_value) : formatCurrencyBR(record.value)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleEditClick(record), 0)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeout(() => handlePaymentsClick(record), 0)}>
                      Pagamentos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleNewPayment(record), 0)}>
                      Pagar
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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Modals */}
      <EditContaDialog open={editOpen} onClose={() => setEditOpen(false)} onRecordUpdated={onRecordUpdated} record={selectedRecord} type={type} />
      <CreateContaDialog open={createOpen} onClose={() => setCreateOpen(false)} onRecordCreated={onRecordUpdated} type={type} />
      <PaymentsDialog open={paymentsDialogOpen} onClose={() => setPaymentsDialogOpen(false)} payments={payments} totalValue={selectedRecord?.value || "0.00"} />

      <CreateDialog
        open={createPaymentOpen}
        onClose={() => setCreatePaymentOpen(false)}
        title="Registrar Pagamento"
        fields={[
          { key: "date", type: "date", label: "Data", placeholder: "" },
          { key: "value", type: "number", label: "Valor", placeholder: "R$ 0.00" },
          { key: "description", type: "text", label: "Descrição", placeholder: "Motivo do pagamento" },
          {
            key: "bank",
            type: "select",
            label: "Banco",
            options: bankOptions.map((bank) => ({
              label: bank.name,
              value: String(bank.id), // ✅ using real ID here
            })),
          },
          { key: "doc_number", type: "text", label: "Documento", placeholder: "Nº do comprovante" },
        ]}
        onSubmit={handleSubmitPayment}
      />
    </div>
  );
};

export default TableComponent;
