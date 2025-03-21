"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FiltersClientType } from "@/types/types";

interface FiltersDialogClientProps {
  filters: FiltersClientType;
  setFilters: (filters: FiltersClientType) => void;
  open: boolean;
  onClose: () => void;
  applyFilters: (filters: FiltersClientType) => void;
  clearFilters: () => void;
}

const FiltersDialogClient: React.FC<FiltersDialogClientProps> = ({
  filters, setFilters, open, onClose, applyFilters, clearFilters,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtros de Clientes</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Nome"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
          <Input
            placeholder="CPF/CNPJ"
            value={filters.cpf_cnpj}
            onChange={(e) => setFilters({ ...filters, cpf_cnpj: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
          <Input
            placeholder="Telefone"
            value={filters.telephone}
            onChange={(e) => setFilters({ ...filters, telephone: e.target.value })}
          />
        </div>

        <DialogFooter>
          <Button onClick={clearFilters} variant="outline">Limpar Filtros</Button>
          <Button onClick={() => { applyFilters(filters); onClose(); }}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersDialogClient;
