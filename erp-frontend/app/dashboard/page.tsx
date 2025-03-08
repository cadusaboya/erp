"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, LayoutGrid, User, PlusCircle } from "lucide-react";

interface Event {
  id: number;
  type: string;
  event_name: string;
  client: number;
  client_name: string;
  date: string;
  total_value: string;
}

interface Client {
  id: number;
  name: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

const Sidebar: React.FC = () => {
  const menuItems = [
    { name: "Eventos", href: "/dashboard", icon: <LayoutGrid size={20} /> },
    { name: "Clientes", href: "/clientes", icon: <User size={20} /> },
    { name: "Extrato", href: "/lancamentos", icon: <Menu size={20} /> },
    { name: "Contas a Pagar", href: "/contas", icon: <Menu size={20} /> },
    { name: "Contas a Receber", href: "/contas/receber", icon: <Menu size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-6">Sistema Financeiro</h1>
      <nav className="flex flex-col gap-3">
        {menuItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <div className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer">
              {item.icon} <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
};

const TableComponent: React.FC<{ data: Event[]; title: string; onEventCreated: () => void }> = ({ data, title, onEventCreated }) => {
  const { register, handleSubmit, reset } = useForm<Event>();
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Fetch clients for dropdown
  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/clients/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar clientes");
      }

      const result = await response.json();
      setClients(result.clients);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const onSubmit = async (formData: Event) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/events/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar evento");
      }

      onEventCreated(); // Trigger a refetch after creation
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} /> Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Evento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              
              {/* Event Name */}
              <Input placeholder="Nome do Evento" {...register("event_name", { required: true })} />

              {/* Event Type Dropdown */}
              <select {...register("type", { required: true })} className="p-2 border rounded w-full">
                <option value="">Selecione um Tipo</option>
                <option value="15 anos">15 Anos</option>
                <option value="empresarial">Empresarial</option>
                <option value="aniversário">Aniversário</option>
                <option value="batizado">Batizado</option>
                <option value="bodas">Bodas</option>
                <option value="casamento">Casamento</option>
                <option value="chá">Chá</option>
                <option value="formatura">Formatura</option>
                <option value="outros">Outros</option>

              </select>

              {/* Client Dropdown - Fetch from API */}
              <select {...register("client", { required: true })} className="p-2 border rounded w-full">
                <option value="">Selecione um Cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>

              {/* Date */}
              <Input type="date" {...register("date", { required: true })} />

              {/* Total Value */}
              <Input type="number" placeholder="Valor Total" {...register("total_value", { required: true })} />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" className="ml-2">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
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
              <TableCell>{event.type}</TableCell>
              <TableCell>R$ {event.total_value}</TableCell>
              <TableCell>
              <Link href={`/dashboard/${event.id}`}>
                <Button variant="outline">Ver Mais</Button>
              </Link>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default function Page() {
  const [data, setData] = useState<Event[]>([]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/events/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar eventos");
      }

      const result = await response.json();
      setData(result.events);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent data={data} title="Eventos" onEventCreated={fetchEvents} />
      </div>
    </div>
  );
}
