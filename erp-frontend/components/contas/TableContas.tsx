import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import EditContaDialog from "@/components/contas/EditContaDialog";
import Filters from "@/components/Filters";
import CreateContaDialog from "@/components/contas/CreateContaDialog";
import { PlusCircle } from "lucide-react";
import { FinanceRecord, FilterFinanceRecordType } from "@/types/types";
import { PaymentsDialog } from "@/components/lancamentos/ViewMoreDialog";
import { fetchPayments } from "@/services/lancamentos";
import CreateDialog from "@/components/CreateDialog"; // 👈 new import
import { createPayment } from "@/services/lancamentos"; // 👈 your service to create a payment

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
    const contentType = type === "bill" ? "bill" : "income";
    const paymentData = await fetchPayments({ content_type: contentType, object_id: record.id });
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

  const handleSubmitPayment = async (formData: Record<string, string>) => {
    if (!recordToPay) return;
    await createPayment({
      ...formData,
      content_type: type,
      object_id: recordToPay.id,
    });
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
              <TableCell>{record.date_due}</TableCell>
              <TableCell>{record.person_name}</TableCell>
              <TableCell>{record.description}</TableCell>
              <TableCell>{record.doc_number || "N/A"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-lg text-sm font-semibold ${record.status === "vencido" ? "bg-red-100 text-red-600" : record.status === "pago" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                {record.status === "parcial" ? `R$ ${Number(record.remaining_value).toFixed(2)}` : `R$ ${Number(record.value).toFixed(2)}`}
              </TableCell>
              <TableCell className="space-y-2">
                <Button variant="outline" onClick={() => handleEditClick(record)}>Editar</Button>
                <Button variant="outline" onClick={() => handlePaymentsClick(record)}>Pagamentos</Button>
                <Button variant="outline" onClick={() => handleNewPayment(record)}>Pagar</Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-4">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>⬅️</button>
        <span>Página {currentPage} de {Math.ceil(data.length / itemsPerPage)}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>➡️</button>
      </div>

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
