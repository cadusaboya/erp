"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { searchResources } from "@/services/resources";
import { createEvent } from "@/services/events";
import { Event, Resource } from "@/types/types";
import { Combobox } from "@/components/ui/combobox";

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  open,
  onClose,
  onEventCreated,
}) => {
  const { register, handleSubmit, reset, setValue, watch, control } = useForm<Event>();
  const [clients] = useState<Resource[]>([]);

  const onSubmit = async (formData: Event) => {
    const success = await createEvent(formData);
    if (success) {
      onEventCreated();
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
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block">Nome do Evento</label>
            <Input placeholder="Nome do Evento" {...register("event_name", { required: true })} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Tipo de Evento</label>
            <Controller
              name="type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 anos">15 Anos</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                    <SelectItem value="aniversário">Aniversário</SelectItem>
                    <SelectItem value="batizado">Batizado</SelectItem>
                    <SelectItem value="bodas">Bodas</SelectItem>
                    <SelectItem value="casamento">Casamento</SelectItem>
                    <SelectItem value="chá">Chá</SelectItem>
                    <SelectItem value="formatura">Formatura</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Cliente</label>
            <Combobox
              options={clients.map((c) => ({ label: c.name, value: String(c.id) }))}
              value={String(watch("client") ?? "")}
              loadOptions={(query) => searchResources("clients", query)}
              onChange={(val) => setValue("client", Number(val))}
              placeholder="Selecione um Cliente"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium block mb-1">Data</label>
              <Controller
                name="date"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Input
                    type="date"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium block mb-1">Valor Total</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Valor Total"
                {...register("total_value", { required: true })}
              />
            </div>
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

export default CreateEventDialog;
