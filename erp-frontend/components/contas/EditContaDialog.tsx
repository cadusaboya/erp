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
import { fetchEvents, fetchSingleEvent } from "@/services/events";
import { fetchResources, fetchSingleResource, searchResources } from "@/services/resources";
import { fetchChartAccounts } from "@/services/chartaccounts";
import { updateRecord } from "@/services/records";
import RatioTable, { getValidAllocations } from "@/components/RatioTable";
import { Combobox } from "@/components/ui/combobox";
import { FinanceRecord, Event, Resource, ChartAccount, RateioItem } from "@/types/types";

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
  const { register, handleSubmit, reset, watch, control } = useForm<FinanceRecord>();
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [eventAllocations, setEventAllocations] = useState<RateioItem[]>([]);
  const [accountAllocations, setAccountAllocations] = useState<RateioItem[]>([]);
  const [person, setPerson] = useState<string>("");
  const [costCenter, setCostCenter] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const rawValue = watch("value");
  const value = parseFloat(rawValue || "0") || 0;

  useEffect(() => {
    const load = async () => {
      if (open) {
        setLoading(true);

        const [eventsResponse, resourcesResponse, chartAccountData] = await Promise.all([
          fetchEvents({}, 1),
          fetchResources(type === "bill" ? "suppliers" : "clients", {}, 1),
          fetchChartAccounts(true),
        ]);

        let eventsData = eventsResponse.results;
        let resourcesData = resourcesResponse.results;

        if (record?.person && !resourcesData.find((r: Resource) => r.id === record.person)) {
          const fallback = await fetchSingleResource(
            type === "bill" ? "suppliers" : "clients",
            record.person
          );
          resourcesData = [...resourcesData, fallback];
        }

        if (record?.event_allocations?.length) {
          const missingEventIds = record.event_allocations
            .map((ea) => Number(ea.event))
            .filter((id) => !eventsData.find((e: Event) => e.id === id));

          const missingEvents = await Promise.all(
            missingEventIds.map((id) => fetchSingleEvent(id))
          );

          eventsData = [...eventsData, ...missingEvents];
        }

        setEvents(eventsData);
        setResources(resourcesData);
        setChartAccounts(chartAccountData);
        if (record) {
          reset(record);

          if (record.person) {
            setPerson(String(record.person));
          }

          if (record.cost_center) {
            setCostCenter(String(record.cost_center));
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

        setLoading(false);
      }
    };
    load();
  }, [open, type, record, reset]);

  const onSubmit = async (formData: FinanceRecord) => {
    if (!record?.id) return;
    const success = await updateRecord(type, record.id, {
      ...formData,
      person,
      cost_center: costCenter,
      expected_date: formData.expected_date,
      event_allocations: getValidAllocations(eventAllocations),
      account_allocations: getValidAllocations(accountAllocations),
    });
    if (success) {
      onRecordUpdated();
      reset();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {type === "bill" ? "Editar Conta a Pagar" : "Editar Recebimento"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            Carregando dados...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      {type === "bill" ? "Fornecedor" : "Cliente"}
                    </label>
                    <Combobox
                      options={resources.map((r) => ({
                        label: r.name,
                        value: String(r.id),
                      }))}
                      loadOptions={(query) =>
                        searchResources(
                          type === "income" ? "clients" : "suppliers",
                          query
                        )
                      }
                      value={person}
                      onChange={setPerson}
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
                      render={({ field }) => (
                        <Input
                          type="date"
                          className="max-w-[150px]"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Data de Vencimento"
                        />
                      )}
                    />
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
                            className="max-w-[150px]"
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Data esperada"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Descrição
                  </label>
                  <Input
                    placeholder="Descrição"
                    {...register("description")}
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Valor</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="max-w-[150px]"
                      placeholder="Valor"
                      {...register("value", { required: true })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Documento
                    </label>
                    <Input
                      className="max-w-[200px]"
                      placeholder="Número do Documento"
                      {...register("doc_number")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Status
                    </label>
                    <select
                      {...register("status")}
                      className="p-2 border rounded w-full"
                    >
                      <option value="em aberto">Em Aberto</option>
                      <option value="vencido">Vencido</option>
                      <option value="pago">Pago</option>
                      <option value="parcial">Parcial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <div className="max-h-[35vh] overflow-y-auto pr-2">
                  <RatioTable
                    allocations={accountAllocations}
                    setAllocations={setAccountAllocations}
                    chartAccounts={chartAccounts
                      .filter((acc) =>
                        type === 'bill'
                          ? acc.code.toString().startsWith('2')
                          : acc.code.toString().startsWith('1')
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
                    events={events}
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

export default EditContaDialog;
