"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PlusCircle, Filter } from "lucide-react";
import CreateEventDialog from "./CreateEventDialog";
import EditEventDialog from "./EditEventDialog";
import Link from "next/link";
import FiltersEventsDialog from "@/components/FiltersEventsDialog"; // Adjust path as needed
import { Event } from "@/types/types";

interface TableComponentProps {
  data: Event[];
  title: string;
  onEventCreated: () => void;
}

const TableComponent: React.FC<TableComponentProps> = ({ data, title, onEventCreated }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [filters, setFilters] = useState({
    event_name: "",
    client: "",
    type: [],
    startDate: "",
    endDate: "",
    minValue: "",
    maxValue: "",
  });

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setEditOpen(true);
  };

  const applyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      event_name: "",
      client: "",
      type: [],
      startDate: "",
      endDate: "",
      minValue: "",
      maxValue: "",
    });
  };

  const filteredData = data.filter((event) => {
    return (
      (!filters.event_name || event.event_name.toLowerCase().includes(filters.event_name.toLowerCase())) &&
      (!filters.client || event.client_name.toLowerCase().includes(filters.client.toLowerCase())) &&
      (!filters.type.length || filters.type.includes(event.type)) &&
      (!filters.startDate || new Date(event.date) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(event.date) <= new Date(filters.endDate)) &&
      (!filters.minValue || parseFloat(event.total_value) >= parseFloat(filters.minValue)) &&
      (!filters.maxValue || parseFloat(event.total_value) <= parseFloat(filters.maxValue))
    );
  });

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

      {/* Filters Dialog */}
      <FiltersEventsDialog
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
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
          {filteredData.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.date}</TableCell>
              <TableCell>{event.event_name}</TableCell>
              <TableCell>{event.client_name}</TableCell>
              <TableCell>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</TableCell>
              <TableCell>R$ {event.total_value}</TableCell>
              <TableCell>
                <Link href={`/dashboard/${event.id}`}>
                  <Button className="mr-2" variant="outline">Ver Mais</Button>
                </Link>
                <Button variant="outline" onClick={() => handleEditClick(event)}>Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TableComponent;
