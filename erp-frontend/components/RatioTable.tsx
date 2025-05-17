"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { searchEvents } from "@/services/events";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axios";

export interface RateioItem {
  id?: number;
  event?: string; // ID
  event_name?: string; // Nome do evento para exibição
  chart_account?: string;
  value: string;
}

interface RateioTableProps {
  allocations: RateioItem[];
  setAllocations: (data: RateioItem[]) => void;
  events?: { id: number; event_name: string }[];
  chartAccounts?: { id: number; code: string; name: string }[];
  label?: string;
}

const RatioTable: React.FC<RateioTableProps> = ({
  allocations = [],
  setAllocations,
  events = [],
  chartAccounts = [],
}) => {
  const isEvent = events && events.length > 0;

  const [eventOptionsMap, setEventOptionsMap] = useState<
    Record<number, { label: string; value: string }[]>
  >({});

  const handleChange = (
    index: number,
    field: keyof RateioItem,
    value: string
  ) => {
    const updated = [...allocations];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setAllocations(updated);
  };

  const addRow = () => {
    const emptyItem = isEvent
      ? { event: "", event_name: "", value: "" }
      : { chart_account: "", value: "" };
    setAllocations([...allocations, emptyItem]);
  };

  const removeRow = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {allocations.map((item, index) => {
        const isEventIdLocked =
          isEvent && item.event && /^\d+$/.test(item.event ?? "") && item.event_name;

        return (
          <div key={index} className="flex items-center gap-2 w-full">
            {isEvent && (
              <Input
                type="number"
                placeholder="ID"
                className="w-[80px]"
                defaultValue={item.event ?? ""}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const input = (e.target as HTMLInputElement).value;
                    if (!input.match(/^\d+$/)) return;

                    try {
                      const res = await api.get(`/events/${input}`);
                      const fetchedEvent = res.data;
                      const label = fetchedEvent.event_name;
                      const value = String(fetchedEvent.id);

                      setEventOptionsMap((prev) => ({
                        ...prev,
                        [index]: [{ label, value }],
                      }));

                      handleChange(index, "event", value);
                      handleChange(index, "event_name", fetchedEvent.event_name);
                    } catch {
                      setEventOptionsMap((prev) => ({
                        ...prev,
                        [index]: [],
                      }));
                      handleChange(index, "event_name", "Evento não encontrado");
                    }
                  }
                }}
              />
            )}

            <div className="flex-grow">
              {isEvent && isEventIdLocked ? (
                <Input
                  type="text"
                  value={item.event_name}
                  disabled
                  className="bg-gray-100 text-gray-700"
                />
              ) : (
                <Combobox
                  options={
                    isEvent
                      ? eventOptionsMap[index]?.length
                        ? eventOptionsMap[index]
                        : events.map((ev) => ({
                            label: ev.event_name,
                            value: String(ev.id),
                          }))
                      : chartAccounts.map((acc) => ({
                          label: acc.code + " | " + acc.name,
                          value: String(acc.id),
                        }))
                  }
                  loadOptions={isEvent ? searchEvents : undefined}
                  value={isEvent ? item.event || "" : item.chart_account || ""}
                  onChange={(val) =>
                    handleChange(
                      index,
                      isEvent ? "event" : "chart_account",
                      val
                    )
                  }
                  placeholder="Selecione"
                />
              )}
            </div>

            <input
              type="number"
              value={item.value}
              onChange={(e) =>
                handleChange(index, "value", e.target.value)
              }
              placeholder="Valor"
              className="p-2 border rounded w-[100px]"
            />

            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-red-500"
            >
              ✕
            </button>
          </div>
        );
      })}

      <div className="flex justify-start mt-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addRow}
          title="Adicionar Rateio"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default RatioTable;
