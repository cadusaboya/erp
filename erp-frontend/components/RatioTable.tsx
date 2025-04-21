interface RateioItem {
  id?: number;
  event: string;
  value: string;
}

interface RateioTableProps {
  allocations: RateioItem[];
  setAllocations: (data: RateioItem[]) => void;
  events?: { id: number; event_name: string }[];
}

const RatioTable: React.FC<RateioTableProps> = ({ allocations = [], setAllocations, events = [] }) => {
  const handleChange = (index: number, field: keyof RateioItem, value: string) => {
    const updated = [...allocations];
    updated[index][field] = value;
    setAllocations(updated);
  };

  const addRow = () => setAllocations([...allocations, { event: "", value: "" }]);
  const removeRow = (index: number) => setAllocations(allocations.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {(allocations || []).map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <select
            value={item.event}
            onChange={(e) => handleChange(index, "event", e.target.value)}
            className="p-2 border rounded w-1/2"
          >
            <option value="">Selecione</option>
            {(events || []).map((ev) => (
              <option key={ev.id} value={String(ev.id)}>{ev.event_name}</option>
            ))}
          </select>
          <input
            type="number"
            value={item.value}
            onChange={(e) => handleChange(index, "value", e.target.value)}
            placeholder="Valor"
            className="p-2 border rounded w-1/3"
          />
          <button onClick={() => removeRow(index)} className="text-red-500">✕</button>
        </div>
      ))}
      <button onClick={addRow} className="text-blue-600 mt-1 underline">Adicionar Rateio</button>
    </div>
  );
};

export default RatioTable;
