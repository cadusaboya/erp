import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchEvents } from "@/services/events";
import { updateBill } from "@/services/bills"

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

interface EditBillDialogProps {
  open: boolean;
  onClose: () => void;
  onBillUpdated: () => void;
  bill: Bill | null;
}

const EditBillDialog: React.FC<EditBillDialogProps> = ({ open, onClose, onBillUpdated, bill }) => {
  const { register, handleSubmit, reset } = useForm<Bill>();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

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

  useEffect(() => {
    if (bill) {
      reset(bill); // Prefill the form with current bill data
    }
  }, [bill, reset]);


    const onSubmit = async (formData: Bill) => {
      const success = await updateBill(formData.id, formData);
      if (success) {
        onBillUpdated(); // Refresh table
        reset();
        onClose(); // Close dialog
      }
    };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input placeholder="Pessoa (Nome)" {...register("person", { required: true })} defaultValue={bill?.person} />
          <Input placeholder="Descrição" {...register("description", { required: true })} defaultValue={bill?.description} />
          <Input type="date" {...register("date_due", { required: true })} defaultValue={bill?.date_due} />
          <Input type="number" placeholder="Valor" {...register("value", { required: true })} defaultValue={bill?.value} />
          <Input placeholder="Número do Documento" {...register("doc_number")} defaultValue={bill?.doc_number} />
          <select {...register("event")} className="p-2 border rounded w-full" defaultValue={bill?.event || ""}>
            <option value="">Sem Evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.event_name}</option>
            ))}
          </select>
          <select {...register("status")} className="p-2 border rounded w-full" defaultValue={bill?.status}>
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

export default EditBillDialog;
