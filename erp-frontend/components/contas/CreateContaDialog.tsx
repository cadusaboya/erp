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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createRecord, deleteRecord } from "@/services/records";
import { createPayment } from "@/services/lancamentos";
import { fetchEvents } from "@/services/events";
import { fetchResources, searchResources } from "@/services/resources";
import { fetchChartAccounts } from "@/services/chartaccounts";
import {
  FinanceRecord,
  Event,
  Resource,
  ChartAccount,
} from "@/types/types";
import RatioTable from "@/components/RatioTable";
import { Combobox } from "@/components/ui/combobox";
import { RateioItem } from "@/components/RatioTable";
import { Controller } from "react-hook-form";
import { getValidAllocations } from "@/components/RatioTable";
import { fetchBanks } from "@/services/banks";
import { Bank } from "@/types/types";


type ExtendedFinanceRecord = FinanceRecord & {
  payment_date?: string;
  payment_value?: string;
  payment_description?: string;
  payment_bank?: string;
  payment_doc_number?: string;
};

interface CreateContaDialogProps {
  open: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  type: "bill" | "income";
}

const CreateContaDialog: React.FC<CreateContaDialogProps> = ({
  open,
  onClose,
  onRecordCreated,
  type,
}) => {
  const { register, handleSubmit, reset, control, watch } = useForm<ExtendedFinanceRecord>();
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [costCenter, setCostCenter] = useState("1");
  const [person, setPerson] = useState("");
  const [status, setStatus] = useState("em aberto");

  const [eventAllocations, setEventAllocations] = useState<RateioItem[]>([]);
  const [accountAllocations, setAccountAllocations] = useState<RateioItem[]>([]);

  const rawValue = watch("value");
  const value = parseFloat(rawValue || "0") || 0;

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          const [
            eventsData,
            resourceData,
            chartAccountsData,
            banksData,
          ] = await Promise.all([
            fetchEvents(),
            fetchResources(type === "bill" ? "suppliers" : "clients"),
            fetchChartAccounts(),
            fetchBanks(),
          ]);
          setEvents(eventsData.results || []);
          setResources(resourceData.results || []);
          setChartAccounts(chartAccountsData || []);
          setBanks(banksData || []);
        } catch (error) {
          console.error("Failed to load initial data:", error);
          setEvents([]);
          setResources([]);
          setChartAccounts([]);
          setBanks([]);
        }
      }
    };
    loadData();
  }, [open, type]);

  const onSubmit = async (formData: ExtendedFinanceRecord) => {
    const success = await createRecord(type, {
      ...formData,
      person,
      cost_center: costCenter,
      status,
      event_allocations: getValidAllocations(eventAllocations),
      account_allocations: getValidAllocations(accountAllocations),
    });
  
    console.log("created id:", success?.id);
  
    if (success?.id && status === "pago") {
      try {
        if (
          !formData.payment_date ||
          !formData.payment_value ||
          !formData.payment_bank
        ) {
          console.error("Campos obrigatórios do pagamento não preenchidos.");
          return;
        }
      
        const paymentPayload = {
          date: formData.payment_date,
          value: formData.payment_value,
          description: formData.payment_description ?? "",
          bank: Number(formData.payment_bank),
          doc_number: formData.payment_doc_number ?? "",
          [type === "bill" ? "bill_id" : "income_id"]: success.id,
        };
  
        await createPayment(paymentPayload);
      } catch (err) {
        console.log(err);
        await deleteRecord(type, success.id);
        return;
      }
    }
  
    if (success) {
      onRecordCreated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {type === "bill" ? "Nova Conta a Pagar" : "Novo Recebimento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} >
          {/* Left Column – All form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Pessoa */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    {type === "bill" ? "Fornecedor" : "Cliente"}
                  </label>
                  <Combobox
                    options={resources.map((r) => ({ label: r.name, value: String(r.id) }))}
                    value={person}
                    onChange={setPerson}
                    loadOptions={(query) =>
                                        searchResources(type === "income" ? "clients" : "suppliers", query)
                                      }
                    placeholder={`Selecione ${type === "bill" ? "um Fornecedor" : "um Cliente"}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Data
                  </label>
                  <Controller
                    name="date_due"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Input
                        type="date"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="dd/mm/aa"
                      />
                    )}
                  />
                </div>
              </div>

              <label className="text-sm font-medium block mb-1">Descrição</label>
              <Input placeholder="Descrição" {...register("description", { required: true })} />

              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Valor</label>
                  <Input className="max-w-[150px]" type="number" step="0.01" placeholder="Valor" {...register("value", { required: true })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Documento</label>
                  <Input className="max-w-[200px]" placeholder="Número do Documento" {...register("doc_number")} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em aberto">Em Aberto</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Centro de Custo */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium block mb-1">Centro de Custo</label>
                  <Select value={costCenter} onValueChange={setCostCenter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o centro de custo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Administração</SelectItem>
                      <SelectItem value="2">Produção de Eventos</SelectItem>
                      <SelectItem value="3">Diretoria</SelectItem>
                      <SelectItem value="11">Ordem de Pagamento</SelectItem>
                      <SelectItem value="12">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {status === "pago" && (
              <div className="space-y-4 pt-4 border-t border-muted">
                <div className="flex flex-wrap gap-4">
                  <div className="w-[150px]">
                    <Controller
                      name="payment_date"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Input className="w-full" type="date" {...field} placeholder="Data" />
                      )}
                    />
                  </div>
                  <div className="w-[150px]">
                    <Input
                      className="w-full"
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      {...register("payment_value", { required: true })}
                    />
                  </div>
                  <div>
                    <Controller
                      name="payment_bank"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={String(bank.id)}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <Input
                    placeholder="Documento de pagamento"
                    {...register("payment_doc_number")}
                  />
                </div>
              </div>
            )}


            </div>

            {/* Right Column – Both Ratio Tables stacked */}
            <div className="space-y-6">
              <div className="max-h-[35vh] overflow-y-auto pr-2">
                <RatioTable
                  allocations={eventAllocations}
                  setAllocations={setEventAllocations}
                  events={events || []}
                  label="Rateio de Eventos"
                  totalValue={value}
                  mode="event"
                />
              </div>
              <div className="max-h-[35vh] overflow-y-auto pr-2">
                <RatioTable
                  allocations={accountAllocations}
                  setAllocations={setAccountAllocations}
                  chartAccounts={chartAccounts.map((acc) => ({
                    id: acc.id,
                    name: acc.description,
                    code: acc.code,
                  }))}
                  label="Rateio por Conta"
                  totalValue={value}
                  mode="account"
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

export default CreateContaDialog;
