"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bank } from "@/types/types";
import { formatDateToInput } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPayment } from "@/services/lancamentos";

const DUMMY_BILL_ID = 99998;
const DUMMY_INCOME_ID = 99999;

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  banks: Bank[];
  onTransferCreated: () => void;
}

const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onClose,
  banks,
  onTransferCreated,
}) => {
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

    const bankFromName = banks.find((b) => b.id === bankFrom)?.name || "";
    const bankToName = banks.find((b) => b.id === bankTo)?.name || "";

    try {
      await createPayment({
        value: String(parsedValue),
        status: "pago",
        date,
        description: description || `Transferência para ${bankToName}`,
        doc_number: "",
        bank: bankFrom,
        bill_id: DUMMY_BILL_ID,
      });

      await createPayment({
        value: String(parsedValue),
        status: "pago",
        date,
        description: description || `Transferência de ${bankFromName}`,
        doc_number: "",
        bank: bankTo,
        income_id: DUMMY_INCOME_ID,
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Transferir Entre Bancos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block">Banco de Origem</label>
            <Select
              onValueChange={(val) => setBankFrom(parseInt(val))}
              value={bankFrom?.toString() ?? ""}
            >
              <SelectTrigger className="min-w-[200px]">
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

          <div className="space-y-2">
            <label className="text-sm font-medium block">Banco de Destino</label>
            <Select
              onValueChange={(val) => setBankTo(parseInt(val))}
              value={bankTo?.toString() ?? ""}
            >
              <SelectTrigger className="min-w-[200px]">
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

          <div className="space-y-2">
            <label className="text-sm font-medium block">Valor</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor da transferência"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Descrição (opcional)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="ml-2">
            Salvar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
