import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentRecord } from "@/types/types";
import { formatCurrencyBR } from "@/lib/utils";

interface PaymentsDialogProps {
  open: boolean;
  onClose: () => void;
  payments: PaymentRecord[];
  totalValue: string;
  onMarkAsPaid: (paymentId: number, date: string) => void;
}

export const PaymentsDialog: React.FC<PaymentsDialogProps> = ({
  open,
  onClose,
  payments,
  totalValue,
  onMarkAsPaid,
}) => {
  const [selectedDateMap, setSelectedDateMap] = useState<Record<number, string>>({});

  const handleChangeDate = (id: number, date: string) => {
    setSelectedDateMap((prev) => ({ ...prev, [id]: date }));
  };

  const totalPaid = payments
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + parseFloat(p.value), 0);

  const remaining = parseFloat(totalValue) - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Detalhes de Pagamentos</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Totais */}
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

          {/* Tabela */}
          <div className="flex-1">
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p>
            ) : (
              <ScrollArea className="h-[240px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Banco</TableCell>
                      <TableCell>Doc Nº</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{formatCurrencyBR(p.value)}</TableCell>
                        <TableCell>{p.bank_name || "-"}</TableCell>
                        <TableCell>{p.doc_number || "-"}</TableCell>
                        <TableCell className="capitalize">
                          {p.status === "pago" ? (
                            <span className="text-green-600 font-semibold">Pago</span>
                          ) : (
                            <span className="text-yellow-600 font-semibold">Agendado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.status === "agendado" ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                type="date"
                                className="w-[130px]"
                                value={selectedDateMap[p.id] || ""}
                                onChange={(e) => handleChangeDate(p.id, e.target.value)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const selected = selectedDateMap[p.id];
                                  if (selected) {
                                    onMarkAsPaid(p.id, selected);
                                  } else {
                                    alert("Selecione a data da baixa.");
                                  }
                                }}
                              >
                                Dar baixa
                              </Button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
