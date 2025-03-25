import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PaymentRecord } from "@/types/types";

interface PaymentsDialogProps {
  open: boolean;
  onClose: () => void;
  payments: PaymentRecord[];
  totalValue: string; // From the Bill or Income
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

        <div className="flex">
          {/* Left side - totals */}
          <div className="flex-1">
            <div>
              <p className="text-sm text-gray-600">Valor Total:</p>
              <p className="text-lg font-bold">R$ {parseFloat(totalValue).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Liquidado:</p>
              <p className="text-lg font-bold text-green-600">R$ {totalPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Saldo:</p>
              <p className="text-lg font-bold text-red-600">R$ {remaining.toFixed(2)}</p>
            </div>
          </div>

          {/* Right side - table */}
          <div className="flex-1">

            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p>
            ) : (
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
                      <TableCell>R$ {parseFloat(p.value).toFixed(2)}</TableCell>
                      <TableCell>{p.bank_name || "-"}</TableCell>
                      <TableCell>{p.doc_number || "-"}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};