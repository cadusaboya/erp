"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createBank } from "@/services/banks";

interface CreateBankDialogProps {
  open: boolean;
  onClose: () => void;
  onBankCreated: () => void;
}

const CreateBankDialog: React.FC<CreateBankDialogProps> = ({ open, onClose, onBankCreated }) => {
  const { register, handleSubmit, reset } = useForm<{ name: string; balance: string }>();

  const onSubmit = async (data: { name: string; balance: string }) => {
    const success = await createBank({ name: data.name, balance: parseFloat(data.balance) });
    if (success) {
      onBankCreated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova Conta Bancária</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Nome do Banco" {...register("name", { required: true })} />
          <Input type="number" step="0.01" placeholder="Saldo Inicial" {...register("balance", { required: true })} />
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

export default CreateBankDialog;
