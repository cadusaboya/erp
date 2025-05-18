"use client";

import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createResource } from "@/services/resources";
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
  onResourceCreated,
}) => {
  const { register, handleSubmit, reset } = useForm<Resource>();
  const resourceLabel = resourceType === "clients" ? "Cliente" : "Fornecedor";

  const onSubmit = async (formData: Resource) => {
    const success = await createResource(resourceType, formData);
    if (success) {
      onResourceCreated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();       // ✅ form reset here
          onClose();     // ✅ parent gets notified
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo {resourceLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block">Nome</label>
            <Input placeholder="Nome" {...register("name", { required: true })} />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium block">Email</label>
              <Input type="email" placeholder="Email" {...register("email")} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium block">Telefone</label>
              <Input placeholder="Telefone" {...register("telephone")} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Endereço</label>
            <Input placeholder="Endereço" {...register("address")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">CPF/CNPJ</label>
            <Input placeholder="CPF/CNPJ" {...register("cpf_cnpj")} />
          </div>

          <DialogFooter className="pt-4">
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
