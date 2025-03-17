"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateEvent } from "@/services/events"; // Ensure this service function is implemented

interface Event {
  id: number;
  type: string;
  event_name: string;
  client: number;
  date: string;
  total_value: string;
  description?: string; // Optional description field
}

interface EditEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  event: Event | null;
}

const EditEventDialog: React.FC<EditEventDialogProps> = ({ open, onClose, onEventUpdated, event }) => {
  const { register, handleSubmit, reset, control } = useForm<Event>();

  // Prefill form with selected event data
  useEffect(() => {
    if (event) {
      reset(event);
    }
  }, [event, reset]);

  // Handle form submission
  const onSubmit = async (formData: Event) => {
    if (!event?.id) return;

    const success = await updateEvent(event.id, formData);
    if (success) {
      onEventUpdated(); // Refresh event list
      reset();
      onClose(); // Close dialog
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Nome do Evento" {...register("event_name", { required: true })} />
          <Input type="date" placeholder="Data" {...register("date", { required: true })} />
          <Input placeholder="ID do Cliente" type="number" {...register("client", { required: true })} />
          <Input type="number" step="0.01" placeholder="Valor Total" {...register("total_value", { required: true })} />
          <select {...register("type")} className="p-2 border rounded w-full" defaultValue={event?.type}>
                <option value="">Selecione o Tipo de Evento</option>
                <option value="15 anos">15 Anos</option>
                <option value="empresarial">Empresarial</option>
                <option value="aniversário">Aniversário</option>
                <option value="batizado">Batizado</option>
                <option value="bodas">Bodas</option>
                <option value="casamento">Casamento</option>
                <option value="chá">Chá</option>
                <option value="formatura">Formatura</option>
                <option value="outros">Outros</option>
          </select>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="ml-2">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;
