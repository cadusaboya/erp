"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { fetchEvents, fetchSingleEvent } from "@/services/events";
import { fetchResources, fetchSingleResource, searchResources } from "@/services/resources";
import { fetchChartAccounts } from "@/services/chartaccounts";
import { fetchBanks } from "@/services/banks";
import { FinanceRecord, Event, Resource, ChartAccount, RateioItem, Bank } from "@/types/types";
import RatioTable, { getValidAllocations } from "@/components/RatioTable";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";

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
  defaultValues?: Partial<FinanceRecord>;
}

const CreateContaDialog: React.FC<CreateContaDialogProps> = ({
  open,
  onClose,
  onRecordCreated,
  type,
  defaultValues,
}) => {
  const { register, handleSubmit, reset, control, watch, setValue } = useForm<ExtendedFinanceRecord>();

  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [costCenter, setCostCenter] = useState("1");
  const [person, setPerson] = useState("");
  const [status, setStatus] = useState("em aberto");
  const [eventAllocations, setEventAllocations] = useState<RateioItem[]>([]);
  const [accountAllocations, setAccountAllocations] = useState<RateioItem[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawValue = watch("value");
  const value = parseFloat(rawValue || "0") || 0;

  useEffect(() => {
    if (status === "pago" && rawValue) {
      setValue("payment_value", rawValue);
    }
  }, [status, rawValue, setValue]);

  const resetDialog = () => {
    reset({
      value: "",
      description: "",
      date_due: "",
      expected_date: "",
      doc_number: "",
      payment_date: "",
      payment_value: "",
      payment_bank: "",
      payment_description: "",
    });
    setEventAllocations([]);
    setAccountAllocations([]);
    setPerson("");
    setCostCenter("1");
    setStatus("em aberto");
    setIsScheduled(false);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      setLoading(true);
      try {
        const [eventsData, resourceData, chartAccountsData, banksData] = await Promise.all([
          fetchEvents(),
          fetchResources(type === "bill" ? "suppliers" : "clients"),
          fetchChartAccounts(true),
          fetchBanks(),
        ]);

        if (defaultValues) {
          if (defaultValues.person && !resourceData.results.find((r: Resource) => r.id === defaultValues.person)) {
            const single = await fetchSingleResource(
              type === "bill" ? "suppliers" : "clients",
              defaultValues.person
            );
            resourceData.results = [...resourceData.results, single];
          }

          if (defaultValues.event_allocations?.length) {
            const missingEventIds = defaultValues.event_allocations
              .map((ea) => Number(ea.event))
              .filter((id) => !eventsData.results.find((e: Event) => e.id === id));

            const missingEvents = await Promise.all(
              missingEventIds.map((id) => fetchSingleEvent(id))
            );
            eventsData.results = [...eventsData.results, ...missingEvents];
          }

          reset({
            ...defaultValues,
            value: defaultValues?.value?.toString() || "",
            date_due: defaultValues?.date_due || "",
            expected_date: defaultValues?.expected_date || "",
            payment_doc_number: defaultValues?.payment_doc_number || "",
          });

          if (defaultValues.person) setPerson(String(defaultValues.person));
          if (defaultValues.cost_center) setCostCenter(String(defaultValues.cost_center));
          if (defaultValues.status) setStatus(defaultValues.status);

          if (defaultValues.event_allocations) {
            setEventAllocations(
              defaultValues.event_allocations.map((ea) => ({
                event: String(ea.event),
                value: String(ea.value),
              }))
            );
          }

          if (defaultValues.account_allocations) {
            setAccountAllocations(
              defaultValues.account_allocations.map((aa) => ({
                chart_account: String(aa.chart_account),
                value: String(aa.value),
              }))
            );
          }
        } else {
            resetDialog();
          }

        setResources(resourceData.results || []);
        setEvents(eventsData.results || []);
        setChartAccounts(chartAccountsData || []);
        setBanks(banksData || []);
      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [open, type, defaultValues, reset]);

  const onSubmit = async (formData: ExtendedFinanceRecord) => {
    const {
      expected_date,
      ...rest
    } = formData;

    const payload = {
      ...rest,
      person,
      cost_center: costCenter,
      status,
      event_allocations: getValidAllocations(eventAllocations),
      account_allocations: getValidAllocations(accountAllocations),
    };

    // Only add expected_date if it's not empty
    if (expected_date) {
      (payload as typeof payload & { expected_date: string }).expected_date = expected_date;
    }

    const success = await createRecord(type, payload);

    if (success?.id && status === "pago") {
      try {
        if (!formData.payment_date || !formData.payment_value || !formData.payment_bank) {
          toast.error("Preencha todos os campos obrigatórios do pagamento.");
          return;
        }

        const paymentPayload = {
          date: formData.payment_date,
          value: formData.payment_value,
          description: formData.payment_description ?? "",
          status: (isScheduled ? "agendado" : "pago") as "pago" | "agendado",
          bank: Number(formData.payment_bank),
          doc_number: formData.payment_doc_number ?? "",
          [type === "bill" ? "bill_id" : "income_id"]: success.id,
        };

        await createPayment(paymentPayload);
      } catch (err) {
        console.error(err);
        await deleteRecord(type, success.id);
        toast.error("Erro ao registrar o pagamento. A conta foi removida.");
        return;
      }
    }

    if (success) {
      toast.success(`${type === "bill" ? "Conta a pagar" : "Conta a receber"} criada com sucesso!`, {
        description: `ID: ${success.id}`,
      });
      onRecordCreated();
      resetDialog();
      onClose();
    } else {
      toast.error("Erro ao criar o registro. Tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetDialog();
        onClose();
      }
    }}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{type === "bill" ? "Nova Conta a Pagar" : "Novo Recebimento"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            Carregando dados...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
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
                    Data de Vencimento
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
              <div className="flex flex-wrap gap-4">
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

                {type === "income" && (
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Data Esperada
                    </label>
                    <Controller
                      name="expected_date"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                )}

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
                        <Input
                          className="w-full"
                          type="date"
                          {...field}
                          value={field.value ?? ""} // evita undefined
                          placeholder="Data"
                        />
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
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                    />
                    Agendar pagamento (cheque ou boleto)
                  </label>
                </div>
              </div>
            )}
            </div>
            
            {/* Right Column – Both Ratio Tables stacked */}
            <div className="space-y-6">
              <div className="max-h-[35vh] overflow-y-auto pr-2">
                <RatioTable
                  allocations={accountAllocations}
                  setAllocations={setAccountAllocations}
                  chartAccounts={chartAccounts
                    .filter((acc) =>
                      type === 'bill'
                        ? acc.code.toString().startsWith('2') // Contas a Pagar → só contas do tipo dívida
                        : acc.code.toString().startsWith('1') // Contas a Receber → só contas do tipo receita
                    )
                    .map((acc) => ({
                      id: acc.id,
                      description: acc.description,
                      code: acc.code,
                    }))}
                  label="Rateio por Conta"
                  totalValue={value}
                  mode="account"
                />
              </div>

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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateContaDialog;
