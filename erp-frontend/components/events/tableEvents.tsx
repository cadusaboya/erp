"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { MoreVertical, PlusCircle, Filter } from "lucide-react";
import CreateEventDialog from "./CreateEventDialog";
import EditEventDialog from "./EditEventDialog";
import Link from "next/link";
import Filters from "@/components/Filters"; // Adjust path as needed
import { Event } from "@/types/types";
import { FiltersEventType } from "@/types/types";
import EventDetailsDialog from "./EventDetailsDialog";
import { formatCurrencyBR } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";


interface TableComponentProps {
  data: Event[];
  title: string;
  onEventCreated: () => void;
  filters: FiltersEventType;
  setFilters: (filters: FiltersEventType) => void; // ✅ Receive filters from parent
}

const TableComponent: React.FC<TableComponentProps> = ({ data, title, onEventCreated, filters, setFilters }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 13;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setEditOpen(true);
  };

  const handleViewClick = (id: string) => {
    setSelectedEventId(id);
    setDialogOpen(true);
  };

  const applyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setFiltersOpen(false);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setFiltersOpen(true)}>
            <Filter size={18} /> Filtros
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle size={18} /> Novo Evento
          </Button>
        </div>
      </div>

      <EventDetailsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        eventId={selectedEventId ?? ""}
      />

      <CreateEventDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onEventCreated={onEventCreated}
      />

      <EditEventDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onEventUpdated={onEventCreated}
        event={selectedEvent}
      />

      <Filters<FiltersEventType>
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={applyFilters}
        clearFilters={() => setFilters({
          event_name: "",
          client: "",
          startDate: "",
          endDate: "",
          minValue: "",
          maxValue: "",
          type: [],
        })}
        filterFields={[
          { key: "event_name", type: "text", label: "Nome do Evento", placeholder: "Nome do Evento" },
          { key: "client", type: "text", label: "Cliente", placeholder: "Cliente" },
          { key: "startDate", type: "date", label: "Data Inicial", placeholder: "Data Inicial" },
          { key: "endDate", type: "date", label: "Data Final", placeholder: "Data Final" },
          { key: "minValue", type: "number", label: "Valor Mínimo", placeholder: "Valor Mínimo" },
          { key: "maxValue", type: "number", label: "Valor Máximo", placeholder: "Valor Máximo" },
          { key: "type", type: "checkboxes", label: "Tipo de Evento", options: ["casamento", "15 anos", "formatura", "aniversário", "empresarial", "outros"] },
        ]}
      />


      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Valor Total</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedData.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{new Date(event.date).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>{event.event_name}</TableCell>
              <TableCell>{event.client_name}</TableCell>
              <TableCell>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</TableCell>
              <TableCell>{formatCurrencyBR(event.total_value)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleViewClick(event.id), 0)}>
                      Ver Mais
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeout(() => handleEditClick(event), 0)}>
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-4">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          ⬅️
        </button>
        <span>Página {currentPage} de {Math.ceil(data.length / itemsPerPage)}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          ➡️
        </button>
      </div>
    </div>
  );
};

export default TableComponent;
