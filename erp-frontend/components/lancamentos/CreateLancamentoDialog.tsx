"use client";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchEvents } from "@/services/events";
import { createOrder } from "@/services/lancamentos"
import { FinanceRecord, Event } from "@/types/types";

interface CreateLancamentoProps {
    open: boolean;
    onClose: () => void;
    onOrderCreated: () => void;
  }

const CreateLancamentoDialog: React.FC<CreateLancamentoProps> = ({ open, onClose, onOrderCreated }) => {
  const { register, handleSubmit, reset } = useForm<FinanceRecord>();
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

  const onSubmit = async (formData: FinanceRecord) => {
    const success = await createOrder(formData); // Dynamically calls for "bill" or "income"
  
    if (success) {
      onOrderCreated(); // Refresh table
      reset();
      onClose(); // Close dialog
    }
  };
  

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <select {...register("type")} className="p-2 border rounded w-full">
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
          <Input {...register("person")} placeholder="Pessoa" />
          <Input {...register("description")} placeholder="Descrição" />
          <Input type="date" {...register("date_due")} />
          <Input {...register("doc_number")} placeholder="Número do Documento" />
          <Input type="number" {...register("value")} placeholder="Valor" />
          <select {...register("event")} className="p-2 border rounded w-full">
            <option value="">Sem Evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.event_name}</option>
            ))}
          </select>
          <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default CreateLancamentoDialog;