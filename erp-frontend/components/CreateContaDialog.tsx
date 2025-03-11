"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createRecord } from "@/services/records";
import { fetchEvents } from "@/services/events";

interface Conta {
  id?: number;
  person: string;
  description: string;
  date_due: string;
  value: string;
  doc_number?: string;
  event?: string | null;
  status: "em aberto" | "pago" | "vencido";
}

interface Event {
  id: number;
  event_name: string;
}

interface CreateContaDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  type: "bill" | "income"; // Type to differentiate
}

const CreateContaDialog: React.FC<CreateContaDialogProps> = ({ open, onClose, onRecordCreated, type }) => {
  const { register, handleSubmit, reset } = useForm<Conta>();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // ✅ Fetch events only when the dialog opens
  useEffect(() => {
    const loadEvents = async () => {
      if (open && !eventsLoaded) {
        const eventsData = await fetchEvents();
        setEvents(eventsData);
        setEventsLoaded(true);
      }
    };
    loadEvents();
  }, [open, eventsLoaded]);

  const onSubmit = async (formData: Conta) => {
    const success = await createRecord(type, formData); // Dynamically calls for "bill" or "income"
  
    if (success) {
      onRecordCreated(); // Refresh table
      reset();
      onClose(); // Close dialog
    }
  };
  

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "bill" ? "Nova Conta a Pagar" : "Novo Recebimento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Pessoa (Nome)" {...register("person", { required: true })} />
          <Input placeholder="Descrição" {...register("description", { required: true })} />
          <Input type="date" {...register("date_due", { required: true })} />
          <Input type="number" placeholder="Valor" {...register("value", { required: true })} />
          <Input placeholder="Número do Documento" {...register("doc_number")} />
          <select {...register("event")} className="p-2 border rounded w-full">
            <option value="">Sem Evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.event_name}
              </option>
            ))}
          </select>
          <select {...register("status")} className="p-2 border rounded w-full">
            <option value="em aberto">Em Aberto</option>
            <option value="pago">Pago</option>
          </select>
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

export default CreateContaDialog;
