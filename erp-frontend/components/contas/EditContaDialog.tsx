"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchEvents } from "@/services/events";
import { fetchResources } from "@/services/resources";
import { fetchChartAccounts } from "@/services/chartaccounts";
import { updateRecord } from "@/services/records";
import RatioTable from "@/components/RatioTable";
import { Combobox } from "@/components/ui/combobox";
import {
  FinanceRecord,
  Event,
  Resource,
  ChartAccount,
} from "@/types/types";

interface EditContaDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordUpdated: () => void;
  record: FinanceRecord | null;
  type: "bill" | "income";
}

const EditContaDialog: React.FC<EditContaDialogProps> = ({
  open,
  onClose,
  onRecordUpdated,
  record,
  type,
}) => {
  const { register, handleSubmit, reset } = useForm<FinanceRecord>();
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [eventAllocations, setEventAllocations] = useState<{ event: string; value: string }[]>([]);
  const [accountAllocations, setAccountAllocations] = useState<{ chart_account: string; value: string }[]>([]);
  const [person, setPerson] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (open) {
        const [eventsData, resourcesData, chartAccountData] = await Promise.all([
          fetchEvents(),
          fetchResources(type === "bill" ? "suppliers" : "clients"),
          fetchChartAccounts()
        ]);
        setEvents(eventsData.results || []);
        setResources(resourcesData.results || []);
        setChartAccounts(chartAccountData);

        if (record) {
          reset(record);

          if (record.person) {
            setPerson(String(record.person));
          }

          if (record.event_allocations) {
            setEventAllocations(
              record.event_allocations.map((ea) => ({
                event: String(ea.event),
                value: String(ea.value),
              }))
            );
          }

          if (record.account_allocations) {
            setAccountAllocations(
              record.account_allocations.map((aa) => ({
                chart_account: String(aa.chart_account),
                value: String(aa.value),
              }))
            );
          }
        }
      }
    };
    load();
  }, [open, type, record, reset]);

  const onSubmit = async (formData: FinanceRecord) => {
    if (!record?.id) return;
    const success = await updateRecord(type, record.id, {
      ...formData,
      person,
      event_allocations: eventAllocations,
      account_allocations: accountAllocations,
    });
    if (success) {
      onRecordUpdated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {type === "bill" ? "Editar Conta a Pagar" : "Editar Recebimento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  {type === "bill" ? "Fornecedor" : "Cliente"}
                </label>
                <Combobox
                  options={resources.map((r) => ({
                    label: r.name,
                    value: String(r.id),
                  }))}
                  value={person}
                  onChange={setPerson}
                  placeholder={`Selecione ${type === "bill" ? "um Fornecedor" : "um Cliente"}`}
                />
              </div>

              <Input placeholder="Descrição" {...register("description")} />
              <Input type="date" {...register("date_due")} />
              <Input type="number" placeholder="Valor" {...register("value")} />
              <Input placeholder="Número do Documento" {...register("doc_number")} />

              {/* Status */}
              <div>
                <label className="text-sm font-medium block mb-1">Status</label>
                <select {...register("status")} className="p-2 border rounded w-full">
                  <option value="em aberto">Em Aberto</option>
                  <option value="vencido">Vencido</option>
                  <option value="pago">Pago</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-1">Rateio de Eventos</label>
                <RatioTable
                  allocations={eventAllocations}
                  setAllocations={setEventAllocations}
                  events={events}
                  label="Rateio de Eventos"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Rateio por Plano de Contas</label>
                <RatioTable
                  allocations={accountAllocations}
                  setAllocations={setAccountAllocations}
                  chartAccounts={chartAccounts.map((acc) => ({
                    id: acc.id,
                    name: acc.description,
                  }))}
                  label="Rateio por Conta"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
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

export default EditContaDialog;
