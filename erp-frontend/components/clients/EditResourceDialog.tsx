"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateResource } from "@/services/resources";

type ResourceType = "clients" | "suppliers";

interface Resource {
  id: number;
  name: string;
  email: string;
  telephone: string;
  address: string;
  cpf_cnpj: string;
}

interface EditResourceDialogProps {
  resourceType: ResourceType;
  open: boolean;
  onClose: () => void;
  onResourceUpdated: () => void;
  resource: Resource | null;
}

const EditResourceDialog: React.FC<EditResourceDialogProps> = ({
  resourceType,
  open,
  onClose,
  onResourceUpdated,
  resource,
}) => {
  const { register, handleSubmit, reset } = useForm<Resource>();

  useEffect(() => {
    if (resource) {
      reset(resource);
    }
  }, [resource, reset]);

  const onSubmit = async (formData: Resource) => {
    if (!resource?.id) return;

    const success = await updateResource(resourceType, resource.id, formData);
    if (success) {
      onResourceUpdated();
      reset();
      onClose();
    }
  };

  const resourceLabel = resourceType === "clients" ? "Cliente" : "Fornecedor";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {resourceLabel}</DialogTitle>
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

export default EditResourceDialog;
