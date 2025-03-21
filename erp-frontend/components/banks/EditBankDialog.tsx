"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateBank } from "@/services/banks";

interface EditBankDialogProps {
  open: boolean;
  onClose: () => void;
  onBankUpdated: () => void;
  bank: { id: number; name: string; balance: string } | null;
}

const EditBankDialog: React.FC<EditBankDialogProps> = ({ open, onClose, onBankUpdated, bank }) => {
  const { register, handleSubmit, reset } = useForm<{ name: string; balance: string }>();

  // Prefill the form with bank info when it opens
  useEffect(() => {
    if (bank) {
      reset({
        name: bank.name,
        balance: bank.balance,
      });
    }
  }, [bank, reset]);

  const onSubmit = async (data: { name: string; balance: string }) => {
    if (!bank?.id) return;
    const success = await updateBank(bank.id, { name: data.name, balance: parseFloat(data.balance) });
    if (success) {
      onBankUpdated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conta Bancária</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Nome do Banco" {...register("name", { required: true })} />
          <Input type="number" step="0.01" placeholder="Saldo Atual" {...register("balance", { required: true })} />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="ml-2">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBankDialog;
