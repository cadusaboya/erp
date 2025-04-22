import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RateioItem {
  id?: number;
  event?: string;
  chart_account?: string;
  value: string;
}

interface RateioTableProps {
  allocations: RateioItem[];
  setAllocations: (data: RateioItem[]) => void;
  events?: { id: number; event_name: string }[];
  chartAccounts?: { id: number; name: string }[];
  label: string;
}

const RatioTable: React.FC<RateioTableProps> = ({
  allocations = [],
  setAllocations,
  events = [],
  chartAccounts = [],
  label
}) => {
  const isEvent = events && events.length > 0;

  const handleChange = (index: number, field: keyof RateioItem, value: string) => {
    const updated = [...allocations];
    updated[index][field] = value;
    setAllocations(updated);
  };

  const addRow = () => {
    const emptyItem = isEvent
      ? { event: "", value: "" }
      : { chart_account: "", value: "" };
    setAllocations([...allocations, emptyItem]);
  };

  const removeRow = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {allocations.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <select
            value={isEvent ? item.event : item.chart_account}
            onChange={(e) =>
              handleChange(index, isEvent ? "event" : "chart_account", e.target.value)
            }
            className="p-2 border rounded w-1/2"
          >
            <option value="">Selecione</option>
            {isEvent
              ? events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.event_name}
                  </option>
                ))
              : chartAccounts.map((acc) => (
                  <option key={acc.id} value={String(acc.id)}>
                    {acc.name}
                  </option>
                ))}
          </select>
          <input
            type="number"
            value={item.value}
            onChange={(e) => handleChange(index, "value", e.target.value)}
            placeholder="Valor"
            className="p-2 border rounded w-1/3"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="text-red-500"
          >
            ✕
          </button>
        </div>
      ))}
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
