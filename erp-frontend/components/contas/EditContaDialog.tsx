"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchEvents } from "@/services/events";
import { fetchResources } from "@/services/resources";
import { updateRecord } from "@/services/records";
import { fetchBanks } from "@/services/banks";
import { FinanceRecord, Event, Resource, Bank } from "@/types/types";

interface EditContaDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordUpdated: () => void;
  record: FinanceRecord | null;
  type: "bill" | "income"; // bill = supplier, income = client
}

const EditContaDialog: React.FC<EditContaDialogProps> = ({ open, onClose, onRecordUpdated, record, type }) => {
  const { register, handleSubmit, reset, watch } = useForm<FinanceRecord>();
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    const load = async () => {
      if (open) {
        const [eventsData, resourcesData, banksData] = await Promise.all([
          fetchEvents(),
          fetchResources(type === "bill" ? "suppliers" : "clients"),
          fetchBanks()
        ]);
        setEvents(eventsData);
        setResources(resourcesData);
        setBanks(banksData);
  
        // ✅ Reset form AFTER resources are ready
        if (record) {
          const normalizedRecord = {
            ...record,
          };
          reset(normalizedRecord);
        }
      }
    };
    load();
  }, [open, type, record, reset]);

  const status = watch("status");
  useEffect(() => {
    if (status !== "pago") {
      reset((prev) => ({
        ...prev,
        bank: undefined,
        payment_doc_number: undefined,
      }));
    }
  }, [status, reset]);
  

  const onSubmit = async (formData: FinanceRecord) => {
    if (!record?.id) return;
    const success = await updateRecord(type, record.id, formData);
    if (success) {
      onRecordUpdated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "bill" ? "Editar Conta a Pagar" : "Editar Recebimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <select {...register("person", { required: true })} className="p-2 border rounded w-full" defaultValue={record?.person || ""}>
            <option value="">Selecione {type === "bill" ? "um Fornecedor" : "um Cliente"}</option>
            {resources.map((res) => (
              <option key={res.id} value={res.id}>{res.name}</option>
            ))}
          </select>

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

          {watch("status") === "pago" && (
            <>
              <select {...register("bank")} className="p-2 border rounded w-full">
                <option value="">Selecione uma Conta Bancária</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
              <Input placeholder="Número do Documento de Pagamento" {...register("payment_doc_number")} />
            </>
          )}

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
