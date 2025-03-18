"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchResources } from "@/services/clientes";
import { createEvent } from "@/services/events";

interface Event {
  id: number;
  type: string;
  event_name: string;
  client: number;
  date: string;
  total_value: string;
}

interface Client {
  id: number;
  name: string;
}

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}


const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ open, onClose, onEventCreated }) => {
  const { register, handleSubmit, reset } = useForm<Event>();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      if (open && !clientsLoaded) {
        const eventsData = await fetchResources("clients");
        setClients(eventsData);
        setClientsLoaded(true);
      }
    };
    loadEvents();
  }, [open, clientsLoaded]);

  const onSubmit = async (formData: Event) => {
    const success = await createEvent(formData); // Dynamically calls for "bill" or "income"
  
    if (success) {
      onEventCreated(); // Refresh table
      reset();
      onClose(); // Close dialog
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Event Name */}
          <Input placeholder="Nome do Evento" {...register("event_name", { required: true })} />

          {/* Event Type Dropdown */}
          <select {...register("type", { required: true })} className="p-2 border rounded w-full">
            <option value="">Selecione um Tipo</option>
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

          {/* Client Dropdown */}
          <select {...register("client", { required: true })} className="p-2 border rounded w-full">
            <option value="">Selecione um Cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          {/* Date */}
          <Input type="date" {...register("date", { required: true })} />

          {/* Total Value */}
          <Input type="number" placeholder="Valor Total" {...register("total_value", { required: true })} />

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
