"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchEvents } from "@/services/events";
import { updateOrder } from "@/services/lancamentos";

interface Order {
    id: number;
    type: string;
    person: string;
    description: string;
    date: string;
    doc_number: string;
    value: string;
    event?: string | null;
  }

interface Event {
  id: number;
  event_name: string;
}

interface EditOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
  order: Order | null;
}

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({ open, onClose, onOrderUpdated, order }) => {
  const { register, handleSubmit, reset } = useForm<Order>();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // ✅ Fetch events when dialog opens
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

  // ✅ Prefill form with selected record data
  useEffect(() => {
    if (order) {
      reset(order);
    }
  }, [order, reset]);

  // ✅ Handles update submission
  const onSubmit = async (formData: Order) => {
    if (!order?.id) return;

    const success = await updateOrder(formData.id, formData);
    if (success) {
      onOrderUpdated(); // Refresh table
      reset();
      onClose(); // Close dialog
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Editar lançamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Pessoa (Nome)" {...register("person", { required: true })} defaultValue={order?.person} />
          <Input placeholder="Descrição" {...register("description", { required: true })} defaultValue={order?.description} />
          <Input type="date" {...register("date", { required: true })} defaultValue={order?.date} />
          <Input type="number" placeholder="Valor" {...register("value", { required: true })} defaultValue={order?.value} />
          <Input placeholder="Número do Documento" {...register("doc_number")} defaultValue={order?.doc_number} />
          <select {...register("event")} className="p-2 border rounded w-full" defaultValue={order?.event || ""}>
            <option value="">Sem Evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.event_name}</option>
            ))}
          </select>
          <select {...register("type")} className="p-2 border rounded w-full" defaultValue={order?.type}>
            <option value="Despesa">Despesa</option>
            <option value="Receita">Receita</option>
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

export default EditOrderDialog;
