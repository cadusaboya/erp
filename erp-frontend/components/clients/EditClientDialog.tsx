"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateClient } from "@/services/clientes"; // Ensure this service function is implemented]

interface Client {
    id: number;
    name: string;
    email: string;
    telephone: string;
    address: string;
    cpf_cnpj: string;
  }  

interface EditClientDialogProps {
  open: boolean;
  onClose: () => void;
  onClientUpdated: () => void;
  client: Client | null;
}

const EditClientDialog: React.FC<EditClientDialogProps> = ({ open, onClose, onClientUpdated, client }) => {
  const { register, handleSubmit, reset } = useForm<Client>();

  // Prefill form with selected client data
  useEffect(() => {
    if (client) {
      reset(client);
    }
  }, [client, reset]);

  // Handle form submission
  const onSubmit = async (formData: Client) => {
    if (!client?.id) return;

    const success = await updateClient(client.id, formData);
    if (success) {
      onClientUpdated(); // Refresh client list
      reset();
      onClose(); // Close dialog
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Nome" {...register("name", { required: true })} />
          <Input type="email" placeholder="Email" {...register("email", { required: true })} />
          <Input placeholder="Telefone" {...register("telephone", { required: true })} />
          <Input placeholder="Endereço" {...register("address", { required: true })} />
          <Input placeholder="CPF/CNPJ" {...register("cpf_cnpj", { required: true })} />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="ml-2">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
