"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createResource } from "@/services/resources"; // assuming you're using the generalized service
import { Resource } from "@/types/types";

type ResourceType = "clients" | "suppliers";

interface CreateResourceDialogProps {
  resourceType: ResourceType;
  open: boolean;
  onClose: () => void;
  onResourceCreated: () => void;
}

const CreateResourceDialog: React.FC<CreateResourceDialogProps> = ({ 
  resourceType, 
  open, 
  onClose, 
  onResourceCreated 
}) => {
  const { register, handleSubmit, reset } = useForm<Resource>();

  const onSubmit = async (formData: Resource) => {
    const success = await createResource(resourceType, formData);
    if (success) {
      onResourceCreated();
      reset();
      onClose();
    }
  };

  const resourceLabel = resourceType === "clients" ? "Cliente" : "Fornecedor";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo {resourceLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Nome" {...register("name", { required: true })} />
          <Input type="email" placeholder="Email" {...register("email", { required: true })} />
          <Input placeholder="Telefone" {...register("telephone", { required: true })} />
          <Input placeholder="Endereço" {...register("address", { required: true })} />
          <Input placeholder="CPF/CNPJ" {...register("cpf_cnpj", { required: true })} />
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

export default CreateResourceDialog;
