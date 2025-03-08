"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createBill } from "@/services/bills";
import { fetchEvents } from "@/services/events";

interface Bill {
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

interface CreateBillDialogProps {
  open: boolean;
  onClose: () => void;
  onBillCreated: () => void;
}

const CreateBillDialog: React.FC<CreateBillDialogProps> = ({ open, onClose, onBillCreated }) => {
  const { register, handleSubmit, reset } = useForm<Bill>();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // ✅ Fetch events only when the dialog is opened
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

  const onSubmit = async (formData: Bill) => {
    const success = await createBill(formData);
    if (success) {
      onBillCreated(); // Refresh table
      reset();
      onClose(); // Close dialog
    }
  };

  return (  
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
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
              <option key={event.id} value={event.id}>{event.event_name}</option>
            ))}
          </select>
          <select {...register("status")} className="p-2 border rounded w-full">
            <option value="em aberto">Em Aberto</option>
            <option value="pago">Pago</option>
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

export default CreateBillDialog;
