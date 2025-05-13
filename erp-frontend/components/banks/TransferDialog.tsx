"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bank } from "@/types/types";
import { formatDateToInput } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPayment } from "@/services/lancamentos";

const DUMMY_BILL_ID = 1;    // ✅ Your dummy Bill ID
const DUMMY_INCOME_ID = 2;  // ✅ Your dummy Income ID

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  banks: Bank[];
  onTransferCreated: () => void;
}

const TransferDialog: React.FC<TransferDialogProps> = ({ open, onClose, banks, onTransferCreated }) => {
  const [bankFrom, setBankFrom] = useState<number | null>(null);
  const [bankTo, setBankTo] = useState<number | null>(null);
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState<string>(formatDateToInput(new Date()));
  const [description, setDescription] = useState<string>("");

  const handleSubmit = async () => {
    if (!bankFrom || !bankTo || !value) return alert("Preencha todos os campos obrigatórios.");
    if (bankFrom === bankTo) return alert("Selecione dois bancos diferentes.");

    const parsedValue = parseFloat(value);
    if (parsedValue <= 0) return alert("O valor deve ser maior que zero.");

    const bankFromName = banks.find(b => b.id === bankFrom)?.name || "";
    const bankToName = banks.find(b => b.id === bankTo)?.name || "";

    try {
      // ✅ Create Payment saída (Despesas → dummy Bill)
      await createPayment({
        value: String(parsedValue),
        date,
        description: description || `Transferência para ${bankToName}`,
        doc_number: "",
        bank: bankFrom,
        bill_id: DUMMY_BILL_ID,
      });

      // ✅ Create Payment entrada (Receitas → dummy Income)
      await createPayment({
        value: String(parsedValue),
        date,
        description: description || `Transferência de ${bankFromName}`,
        doc_number: "",
        bank: bankTo,
        income_id: DUMMY_INCOME_ID
      });

      onTransferCreated();
      handleClose();

    } catch (error) {
      console.error(error);
      alert("Erro ao registrar a transferência.");
    }
  };

  const handleClose = () => {
    setBankFrom(null);
    setBankTo(null);
    setValue("");
    setDate(formatDateToInput(new Date()));
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir Entre Bancos</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm">Banco Origem</label>
            <Select onValueChange={(value: string) => setBankFrom(parseInt(value))} value={bankFrom?.toString() ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o banco de origem" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id.toString()}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm">Banco Destino</label>
            <Select onValueChange={(value: string) => setBankTo(parseInt(value))} value={bankTo?.toString() ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o banco de destino" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id.toString()}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm">Valor</label>
            <Input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Descrição (opcional)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Button onClick={handleSubmit}>Salvar Transferência</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
