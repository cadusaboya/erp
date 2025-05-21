"use client";

import { useEffect, useState } from "react";
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
import { updateEvent } from "@/services/events";
import { Event, Resource } from "@/types/types";
import { Combobox } from "@/components/ui/combobox";
import {
  fetchResources,
  fetchSingleResource,
  searchResources,
} from "@/services/resources";
import { Controller } from "react-hook-form";

interface EditEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  event: Event | null;
}

const EditEventDialog: React.FC<EditEventDialogProps> = ({
  open,
  onClose,
  onEventUpdated,
  event,
}) => {
  const { register, handleSubmit, reset, setValue, watch, control } = useForm<Event>();
  const [clients, setClients] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!open) return;
      setLoading(true);

      try {
        const response = await fetchResources("clients");
        let clientList = response.results || [];

        if (event?.client && !clientList.find((client: Resource) => client.id === event.client)) {
          const fallback = await fetchSingleResource("clients", event.client);
          clientList = [...clientList, fallback];
        }

        setClients(clientList);
        if (event) reset(event);
      } catch (err) {
        console.error("Erro ao carregar dados do cliente:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, event, reset]);

  const onSubmit = async (formData: Event) => {
    if (!event?.id) return;
    const success = await updateEvent(event.id, formData);
    if (success) {
      onEventUpdated();
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            Carregando dados...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Nome do Evento</label>
              <Input
                placeholder="Nome do Evento"
                {...register("event_name", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Tipo de Evento</label>
              <Select
                value={watch("type")}
                onValueChange={(val) => setValue("type", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 anos">15 Anos</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="aniversário">Aniversário</SelectItem>
                  <SelectItem value="batizado">Batizado</SelectItem>
                  <SelectItem value="bodas">Bodas</SelectItem>
                  <SelectItem value="casamento">Casamento</SelectItem>
                  <SelectItem value="chá">Chá</SelectItem>
                  <SelectItem value="formatura">Formatura</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Cliente</label>
              <Combobox
                options={clients.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                }))}
                value={String(watch("client") ?? "")}
                loadOptions={(query) => searchResources("clients", query)}
                onChange={(val) => setValue("client", Number(val))}
                placeholder="Selecione um Cliente"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium block mb-1">Data</label>
                <Controller
                      name="date"
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
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium block mb-1">Valor Total</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor Total"
                  {...register("total_value", { required: true })}
                />
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

export default EditEventDialog;
