"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/services/clientes";

interface Client {
  id: number;
  name: string;
  email: string;
  telephone: string;
  address: string;
  cpf_cnpj: string;
}

interface CreateClientDialogProps {
  open: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

const CreateClientDialog: React.FC<CreateClientDialogProps> = ({ open, onClose, onClientCreated }) => {
  const { register, handleSubmit, reset } = useForm<Client>();

  const onSubmit = async (formData: any) => {
    const success = await createClient(formData); // Dynamically calls for "bill" or "income"
  
    if (success) {
      onClientCreated(); // Refresh table
      reset();
      onClose(); // Close dialog
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Nome" {...register("name", { required: true })} />
          <Input type="email" placeholder="Email" {...register("email", { required: true })} />
          <Input placeholder="Telefone" {...register("telephone", { required: true })} />
          <Input placeholder="Endereço" {...register("address", { required: true })} />
          <Input placeholder="CPF/CNPJ" {...register("cpf_cnpj", { required: true })} />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} >
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

export default CreateClientDialog;
