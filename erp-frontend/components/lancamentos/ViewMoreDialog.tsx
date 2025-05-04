import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"; // ✅ You may need to import this
import { PaymentRecord } from "@/types/types";
import { formatCurrencyBR } from "@/lib/utils";

interface PaymentsDialogProps {
  open: boolean;
  onClose: () => void;
  payments: PaymentRecord[];
  totalValue: string;
}

export const PaymentsDialog: React.FC<PaymentsDialogProps> = ({ open, onClose, payments, totalValue }) => {
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.value), 0);
  const remaining = parseFloat(totalValue) - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes de Pagamentos</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Left side - totals */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm text-gray-600">Valor Total:</p>
              <p className="text-lg font-bold">{formatCurrencyBR(totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Liquidado:</p>
              <p className="text-lg font-bold text-green-600">{formatCurrencyBR(totalPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Saldo:</p>
              <p className="text-lg font-bold text-red-600">{formatCurrencyBR(remaining)}</p>
            </div>
          </div>

          {/* Right side - scrollable table */}
          <div className="flex-1">
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p>
            ) : (
              <ScrollArea className="h-[200px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Banco</TableCell>
                      <TableCell>Doc Nº</TableCell>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{formatCurrencyBR(p.value)}</TableCell>
                        <TableCell>{p.bank_name || "-"}</TableCell>
                        <TableCell>{p.doc_number || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
