"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createRecord } from "@/services/records";
import { fetchEvents } from "@/services/events";
import { fetchResources } from "@/services/resources";
import { fetchBanks } from "@/services/banks";
import { fetchChartAccounts } from "@/services/chartaccounts";
import { FinanceRecord, Event, Resource, Bank, ChartAccount } from "@/types/types";
import RatioTable from "@/components/RatioTable";

interface CreateContaDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  type: "bill" | "income";
}

const CreateContaDialog: React.FC<CreateContaDialogProps> = ({ open, onClose, onRecordCreated, type }) => {
  const { register, handleSubmit, reset } = useForm<FinanceRecord>();
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);

  const [costCenter, setCostCenter] = useState("1");
  const [person, setPerson] = useState("");
  const [status, setStatus] = useState("em aberto");

  const [eventAllocations, setEventAllocations] = useState<{ event: string; value: string }[]>([]);
  const [accountAllocations, setAccountAllocations] = useState<{ chart_account: string; value: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          const [eventsData, resourceData, banksData, chartAccountsData] = await Promise.all([
            fetchEvents(),
            fetchResources(type === "bill" ? "suppliers" : "clients"),
            fetchBanks(),
            fetchChartAccounts()
          ]);
          setEvents(eventsData || []);
          setResources(resourceData || []);
          setBanks(banksData || []);
          setChartAccounts(chartAccountsData || []);
        } catch (error) {
          console.error("Failed to load initial data:", error);
          setEvents([]);
          setResources([]);
          setBanks([]);
          setChartAccounts([]);
        }
      }
    };
    loadData();
  }, [open, type]);

  const onSubmit = async (formData: FinanceRecord) => {
    const success = await createRecord(type, {
      ...formData,
      person,
      cost_center: costCenter,
      status,
      event_allocations: eventAllocations,
      account_allocations: accountAllocations
    });
    if (success) {
      onRecordCreated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {type === "bill" ? "Nova Conta a Pagar" : "Novo Recebimento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Pessoa */}
          <div>
            <label className="text-sm font-medium block mb-1">{type === "bill" ? "Fornecedor" : "Cliente"}</label>
            <Select value={person} onValueChange={(val) => setPerson(val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${type === "bill" ? "um Fornecedor" : "um Cliente"}`} />
              </SelectTrigger>
              <SelectContent>
                {(resources || []).map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input placeholder="Descrição" {...register("description", { required: true })} />
          <Input type="date" {...register("date_due", { required: true })} />
          <Input type="number" placeholder="Valor" {...register("value", { required: true })} />
          <Input placeholder="Número do Documento" {...register("doc_number")} />

          {/* Centro de Custo */}
          <div>
            <label className="text-sm font-medium block mb-1">Centro de Custo</label>
            <Select value={costCenter} onValueChange={setCostCenter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o centro de custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Operacional</SelectItem>
                <SelectItem value="2">Administração</SelectItem>
                <SelectItem value="3">Diretoria</SelectItem>
                <SelectItem value="4">Ordem de Pagamento</SelectItem>
                <SelectItem value="5">Produção de Eventos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rateio de Eventos */}
          <div>
            <label className="text-sm font-medium block mb-1">Rateio de Eventos</label>
            <RatioTable
              allocations={eventAllocations}
              setAllocations={setEventAllocations}
              events={events || []}
              label="Rateio de Eventos"
            />
          </div>

          {/* Rateio por Plano de Contas */}
          <div>
            <label className="text-sm font-medium block mb-1">Rateio por Plano de Contas</label>
            <RatioTable
              allocations={accountAllocations}
              setAllocations={setAccountAllocations}
              chartAccounts={chartAccounts.map((acc) => ({ id: acc.id, name: acc.description }))}
              label="Rateio por Conta"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium block mb-1">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em aberto">Em Aberto</SelectItem>
              </SelectContent>
            </Select>
          </div>

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