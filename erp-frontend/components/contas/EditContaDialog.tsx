"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchEvents } from "@/services/events";
import { updateRecord } from "@/services/records"; // ✅ Uses generic API

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

interface EditContaDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordUpdated: () => void;
  record: Conta | null;
  type: "bill" | "income"; // ✅ Determines if it's editing a bill or income
}

const EditContaDialog: React.FC<EditContaDialogProps> = ({ open, onClose, onRecordUpdated, record, type }) => {
  const { register, handleSubmit, reset } = useForm<Conta>();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // ✅ Fetch events only when dialog opens
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
    if (record) {
      reset(record);
    }
  }, [record, reset]);

  // ✅ Handles update submission
  const onSubmit = async (formData: Conta) => {
    if (!record?.id) return;

    const success = await updateRecord(type, record.id, formData);
    if (success) {
      onRecordUpdated(); // Refresh table
      reset();
      onClose(); // Close dialog
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "bill" ? "Editar Conta a Pagar" : "Editar Recebimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Pessoa (Nome)" {...register("person", { required: true })} defaultValue={record?.person} />
          <Input placeholder="Descrição" {...register("description", { required: true })} defaultValue={record?.description} />
          <Input type="date" {...register("date_due", { required: true })} defaultValue={record?.date_due} />
          <Input type="number" placeholder="Valor" {...register("value", { required: true })} defaultValue={record?.value} />
          <Input placeholder="Número do Documento" {...register("doc_number")} defaultValue={record?.doc_number} />
          <select {...register("event")} className="p-2 border rounded w-full" defaultValue={record?.event || ""}>
            <option value="">Sem Evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.event_name}</option>
            ))}
          </select>
          <select {...register("status")} className="p-2 border rounded w-full" defaultValue={record?.status}>
            <option value="em aberto">Em Aberto</option>
            <option value="pago">Pago</option>
            <option value="vencido">Vencido</option>
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

export default EditContaDialog;
