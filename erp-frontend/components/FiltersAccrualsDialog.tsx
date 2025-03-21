"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FilterFinanceRecordType } from "@/types/types";

interface FiltersDialogProps {
  filters: FilterFinanceRecordType;
  setFilters: (filters: FilterFinanceRecordType) => void;
  open: boolean;
  onClose: () => void;
  applyFilters: (filters: FilterFinanceRecordType) => void;
  clearFilters: () => void;
  filterOptions: string[]; // e.g., ["em aberto", "pago", "vencido"] or ["despesa", "receita"]
  filterKey: "status" | "type"; // Defines which key to update
}

import { useEffect, useState } from "react";

const FiltersDialog: React.FC<FiltersDialogProps> = ({
  filters, setFilters, open, onClose, applyFilters, clearFilters
}) => {
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    if (open) {
      setDraftFilters(filters); // Sync with parent when dialog opens
    }
  }, [open, filters]);

  const handleStatusChange = (value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      status: prev.status?.includes(value)
        ? prev.status.filter((s) => s !== value)
        : [...(prev.status || []), value],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {[
            { type: "date", placeholder: "Data Inicial", value: draftFilters.startDate, key: "startDate" },
            { type: "date", placeholder: "Data Final", value: draftFilters.endDate, key: "endDate" },
            { type: "text", placeholder: "Pessoa", value: draftFilters.person, key: "person" },
            { type: "text", placeholder: "Descrição", value: draftFilters.description, key: "description" },
            { type: "number", placeholder: "Valor Mínimo", value: draftFilters.minValue, key: "minValue" },
            { type: "number", placeholder: "Valor Máximo", value: draftFilters.maxValue, key: "maxValue" },
          ].map(({ type, placeholder, value, key }) => (
            <Input
              key={key}
              type={type}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setDraftFilters({ ...draftFilters, [key]: e.target.value })}
            />
          ))}

          <div className="border p-2 rounded-md bg-white shadow-md">
            <label className="block font-semibold mb-2">Status</label>
            <div className="flex flex-row">
              {["em aberto", "vencido", "pago"].map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer mr-5">
                  <input
                    type="checkbox"
                    checked={draftFilters.status?.includes(option) ?? false}
                    onChange={() => handleStatusChange(option)}
                  />
                  <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button onClick={() => { clearFilters(); onClose(); }} variant="outline">
            Limpar Filtros
          </Button>
          <Button
            onClick={() => {
              applyFilters(draftFilters);
              setFilters(draftFilters); // sync with parent
              onClose();
            }}
          >
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersDialog;
