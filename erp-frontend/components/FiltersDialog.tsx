"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type FiltersType = {
  startDate: string;
  endDate: string;
  person: string;
  description: string;
  status?: string[]; // Used for Lancamentos
  type?: string[];   // Used for Order
  minValue: string;
  maxValue: string;
};

interface FiltersDialogProps {
  filters: FiltersType;
  setFilters: (filters: FiltersType) => void;
  open: boolean;
  onClose: () => void;
  applyFilters: (filters: FiltersType) => void;
  clearFilters: () => void;
  filterOptions: string[]; // e.g., ["em aberto", "pago", "vencido"] or ["despesa", "receita"]
  filterKey: "status" | "type"; // Defines which key to update
}

const FiltersDialog: React.FC<FiltersDialogProps> = ({
  filters, setFilters, open, onClose, applyFilters, clearFilters, filterOptions, filterKey
}) => {
  
  // Função para lidar com a seleção do status ou tipo
  const handleFilterChange = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterKey]: prevFilters[filterKey]?.includes(value)
        ? prevFilters[filterKey]?.filter((s) => s !== value)
        : [...(prevFilters[filterKey] || []), value],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Inputs Reutilizáveis */}
          {[
            { type: "date", placeholder: "Data Inicial", value: filters.startDate, key: "startDate" },
            { type: "date", placeholder: "Data Final", value: filters.endDate, key: "endDate" },
            { type: "text", placeholder: "Pessoa", value: filters.person, key: "person" },
            { type: "text", placeholder: "Descrição", value: filters.description, key: "description" },
            { type: "number", placeholder: "Valor Mínimo", value: filters.minValue, key: "minValue" },
            { type: "number", placeholder: "Valor Máximo", value: filters.maxValue, key: "maxValue" },
          ].map(({ type, placeholder, value, key }) => (
            <Input
              key={key}
              type={type}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
            />
          ))}

          {/* Filtro Dinâmico (Status ou Tipo) */}
          <div className="border p-2 rounded-md bg-white shadow-md">
            <label className="block font-semibold mb-2">{filterKey === "status" ? "Status" : "Tipo"}</label>
            <div className="flex flex-row">
              {filterOptions.map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer mr-5">
                  <input
                    type="checkbox"
                    checked={filters[filterKey]?.includes(option) ?? false}
                    onChange={() => handleFilterChange(option)}
                  />
                  <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Botões de Ação */}
        <DialogFooter>
          <Button onClick={clearFilters} variant="outline">
            Limpar Filtros
          </Button>
          <Button onClick={() => { applyFilters(filters); onClose(); }}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersDialog;
