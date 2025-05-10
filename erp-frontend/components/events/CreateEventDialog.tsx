"use client";

import { useState } from "react";
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
  const { register, handleSubmit, reset, setValue, watch } = useForm<Event>();
  const [clients ] = useState<Resource[]>([]);

  const onSubmit = async (formData: Event) => {
    const success = await createEvent(formData);
    if (success) {
      onEventCreated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Event Name */}
          <Input placeholder="Nome do Evento" {...register("event_name", { required: true })} />

          {/* Event Type (shadcn Select) */}
          <div>
            <Select
              value={watch("type")}
              onValueChange={(val) => setValue("type", val)}
            >
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
          </div>

          {/* Cliente (Combobox) */}
          <div>
          <Combobox
            options={clients.map((c) => ({ label: c.name, value: String(c.id) }))}
            value={String(watch("client") ?? "")} // converte number para string
            loadOptions={(query) => searchResources("clients", query)}
            onChange={(val) => setValue("client", Number(val))} // converte string para number
            placeholder="Selecione um Cliente"
          />
          </div>

          {/* Date */}
          <Input type="date" {...register("date", { required: true })} />

          {/* Total Value */}
          <Input type="number" step="0.01" placeholder="Valor Total" {...register("total_value", { required: true })} />

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

export default CreateEventDialog;
