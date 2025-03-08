"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type FiltersType = {
  startDate: string;
  endDate: string;
  person: string;
  description: string;
  status: string[];
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
}

const FiltersDialog: React.FC<FiltersDialogProps> = ({ filters, setFilters, open, onClose, applyFilters, clearFilters }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input type="date" placeholder="Data Inicial" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          <Input type="date" placeholder="Data Final" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          <Input placeholder="Pessoa" value={filters.person} onChange={(e) => setFilters({ ...filters, person: e.target.value })} />
          <Input placeholder="Descrição" value={filters.description} onChange={(e) => setFilters({ ...filters, description: e.target.value })} />
          <Input type="number" placeholder="Valor Mínimo" value={filters.minValue} onChange={(e) => setFilters({ ...filters, minValue: e.target.value })} />
          <Input type="number" placeholder="Valor Máximo" value={filters.maxValue} onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })} />
          <div className="border p-2 rounded-md bg-white shadow-md">
            <label className="block font-semibold mb-2">Status</label>
            <div className="flex flex-row">
              {["em aberto", "pago", "vencido"].map((status) => (
                <label key={status} className="flex items-center space-x-2 cursor-pointer mr-5">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) ?? false}
                    onChange={() => {
                      setFilters((prevFilters) => ({
                        ...prevFilters,
                        status: prevFilters.status.includes(status)
                          ? prevFilters.status.filter((s) => s !== status)
                          : [...prevFilters.status, status],
                      }));
                    }}
                  />
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={clearFilters} variant="outline">
            Limpar Filtros
          </Button>
          <Button onClick={() => applyFilters(filters)}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersDialog;
