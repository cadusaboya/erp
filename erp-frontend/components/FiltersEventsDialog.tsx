"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FiltersEventType } from "@/types/types";

interface FiltersEventsDialogProps {
  filters: FiltersEventType;
  setFilters: (filters: FiltersEventType) => void;
  open: boolean;
  onClose: () => void;
  applyFilters: (filters: FiltersEventType) => void;
  clearFilters: () => void;
}

const eventTypes = ["casamento", "15 anos", "formatura", "aniversário", "empresarial", "outros"];

const FiltersEventsDialog: React.FC<FiltersEventsDialogProps> = ({
  filters, setFilters, open, onClose, applyFilters, clearFilters
}) => {

  const handleTypeChange = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      type: prevFilters.type.includes(value)
        ? prevFilters.type.filter((t) => t !== value)
        : [...prevFilters.type, value],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtros de Eventos</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Nome do Evento"
            value={filters.event_name}
            onChange={(e) => setFilters({ ...filters, event_name: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Cliente"
            value={filters.client}
            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
          />
          <Input
            type="date"
            placeholder="Data Inicial"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            type="date"
            placeholder="Data Final"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Valor Mínimo"
            value={filters.minValue}
            onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Valor Máximo"
            value={filters.maxValue}
            onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
          />

          {/* Event type filter */}
          <div className="border p-2 rounded-md bg-white shadow-md">
            <label className="block font-semibold mb-2">Tipo de Evento</label>
            <div className="flex flex-wrap gap-3">
              {eventTypes.map((eventType) => (
                <label key={eventType} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.type.includes(eventType)}
                    onChange={() => handleTypeChange(eventType)}
                  />
                  <span>{eventType.charAt(0).toUpperCase() + eventType.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

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

export default FiltersEventsDialog;
