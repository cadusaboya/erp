interface RateioItem {
    id?: number;
    chart_account: string;
    value: string;
  }
  
  interface RateioTableProps {
    data: RateioItem[];
    setData: (data: RateioItem[]) => void;
    chartAccounts: { id: number; name: string }[];
    label: string;
  }
  
  const RateioTable: React.FC<RateioTableProps> = ({ data, setData, chartAccounts, label }) => {
    const handleChange = (index: number, field: keyof RateioItem, value: string) => {
      const updated = [...data];
      updated[index][field] = value;
      setData(updated);
    };
  
    const addRow = () => setData([...data, { chart_account: "", value: "" }]);
    const removeRow = (index: number) => setData(data.filter((_, i) => i !== index));
  
    return (
      <div className="space-y-2">
        <h3 className="font-semibold">{label}</h3>
        {data.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <select
              value={item.chart_account}
              onChange={(e) => handleChange(index, "chart_account", e.target.value)}
              className="p-2 border rounded w-1/2"
            >
              <option value="">Selecione</option>
              {chartAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
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
  
  export default RateioTable;
  