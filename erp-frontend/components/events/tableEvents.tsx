"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { MoreVertical, PlusCircle, Filter } from "lucide-react";
import CreateEventDialog from "./CreateEventDialog";
import EditEventDialog from "./EditEventDialog";
import Filters from "@/components/Filters";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { deleteEvent } from "@/services/events"; // ✅ adjust path if needed

interface TableComponentProps {
  data: Event[];
  title: string;
  onEventCreated: () => void;
  filters: FiltersEventType;
  setFilters: (filters: FiltersEventType) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalCount: number;
}

const TableComponent: React.FC<TableComponentProps> = ({
  data,
  title,
  onEventCreated,
  filters,
  setFilters,
  currentPage,
  setCurrentPage,
  totalCount,
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setEditOpen(true);
  };

  const handleViewClick = (id: string) => {
    setSelectedEventId(id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteOpen(true);
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
        clearFilters={() =>
          setFilters({
            event_name: "",
            client: "",
            startDate: "",
            endDate: "",
            minValue: "",
            maxValue: "",
            type: [],
          })
        }
        filterFields={[
          { key: "event_name", type: "text", label: "Nome do Evento", placeholder: "Nome do Evento" },
          { key: "client", type: "text", label: "Cliente", placeholder: "Cliente" },
          { key: "startDate", type: "date", label: "Data Inicial", placeholder: "Data Inicial" },
          { key: "endDate", type: "date", label: "Data Final", placeholder: "Data Final" },
          { key: "minValue", type: "number", label: "Valor Mínimo", placeholder: "Valor Mínimo" },
          { key: "maxValue", type: "number", label: "Valor Máximo", placeholder: "Valor Máximo" },
          {
            key: "type",
            type: "checkboxes",
            label: "Tipo de Evento",
            options: ["casamento", "15 anos", "formatura", "aniversário", "empresarial", "outros"],
          },
        ]}
      />

    <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
          <TableCell className="w-1/12 min-w-[80px]">Data</TableCell>
          <TableCell className="w-3/12 min-w-[160px]">Cliente</TableCell>
          <TableCell className="w-5/12 min-w-[240px]">Nome</TableCell>
          <TableCell className="w-1/12 min-w-[80px]">Tipo</TableCell>
          <TableCell className="w-2/12 min-w-[100px]">Valor Total</TableCell>
          <TableCell className="w-1/12 min-w-[60px] text-center">Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {data.map((event) => (
            <TableRow key={event.id} className="h-[56px] align-middle">
              <TableCell className="w-1/12 min-w-[80px]">{new Date(event.date + "T00:00:00").toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                })}</TableCell>
              <TableCell className="w-3/12 min-w-[160px]">
                <div className="truncate" title={event.client_name}>{event.client_name}</div>
              </TableCell>
              <TableCell className="w-4/12 min-w-[240px]">
                <div className="truncate" title={event.event_name}>{event.event_name}</div>
              </TableCell>
              <TableCell className="w-1/12 min-w-[80px]">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</TableCell>
              <TableCell className="w-2/12 min-w-[100px]">{formatCurrencyBR(event.total_value)}</TableCell>
              <TableCell className="w-1/12 min-w-[60px] text-center">
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
                    <DropdownMenuItem onClick={() => setTimeout(() => handleDeleteClick(event), 0)}>
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <Pagination className="mt-4 justify-center">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {currentPage > 2 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <span className="px-2">...</span>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationLink isActive>{currentPage}</PaginationLink>
          </PaginationItem>

          {currentPage < totalPages - 1 && (
            <>
              <PaginationItem>
                <span className="px-2">...</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento será excluído permanentemente e não poderá ser restaurado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedEvent) return;
                await deleteEvent(selectedEvent.id);
                setDeleteOpen(false);
                setSelectedEvent(null);
                onEventCreated();
              }}
            >
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TableComponent;
