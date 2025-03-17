import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import CreateEventDialog from "./CreateEventDialog";
import EditEventDialog from "./EditEventDialog";
import Link from "next/link";

interface Event {
  id: number;
  type: string;
  event_name: string;
  client: number;
  client_name: string;
  date: string;
  total_value: string;
}

interface TableComponentProps {
    data: Event[];
    title: string;
    onEventCreated: () => void;
  }

const TableComponent: React.FC<TableComponentProps> = ({ data, title, onEventCreated }) => {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const handleEditClick = (event: Event) => {
      setSelectedEvent(event);
      setEditOpen(true);
    };
  
    return (
        <div className="p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle size={18} /> Novo Evento
          </Button>
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
            {data.map((event) => (
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