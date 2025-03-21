"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createRecord } from "@/services/records";
import { fetchEvents } from "@/services/events";
import { fetchResources } from "@/services/resources";
import { fetchBanks } from "@/services/banks";
import { FinanceRecord, Event, Resource, Bank } from "@/types/types";

interface CreateContaDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  type: "bill" | "income"; // bill = supplier, income = client
}

const CreateContaDialog: React.FC<CreateContaDialogProps> = ({ open, onClose, onRecordCreated, type }) => {
  const { register, handleSubmit, reset, watch } = useForm<FinanceRecord>();
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        const [eventsData, resourceData, banksData] = await Promise.all([
          fetchEvents(),
          fetchResources(type === "bill" ? "suppliers" : "clients"),
          fetchBanks()
        ]);
        setEvents(eventsData);
        setResources(resourceData);
        setBanks(banksData)
      }
    };
    loadData();
  }, [open, type]);

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
    const success = await createRecord(type, formData);
    if (success) {
      onRecordCreated();
      reset();
      onClose();
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
          {/* Dynamic Resource Dropdown */}
          <select {...register("person", { required: true })} className="p-2 border rounded w-full">
            <option value="">
              Selecione {type === "bill" ? "um Fornecedor" : "um Cliente"}
            </option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <Input placeholder="Descrição" {...register("description", { required: true })} />
          <Input type="date" {...register("date_due", { required: true })} />
          <Input type="number" placeholder="Valor" {...register("value", { required: true })} />
          <Input placeholder="Número do Documento" {...register("doc_number")} />

          {/* Events Dropdown */}
          <select {...register("event")} className="p-2 border rounded w-full">
            <option value="">Sem Evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.event_name}</option>
            ))}
          </select>

          {/* Status */}
          <select {...register("status")} className="p-2 border rounded w-full" defaultValue="em aberto">
            <option value="em aberto">Em Aberto</option>
            <option value="pago">Pago</option>
          </select>

          {status === "pago" && (
            <>
              <select {...register("bank", { required: true })} className="p-2 border rounded w-full">
                <option value="">Selecione uma Conta Bancária</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
              <Input
                placeholder="Número do Documento de Pagamento"
                {...register("payment_doc_number", { required: true })}
              />
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

export default CreateContaDialog;
