"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, LayoutGrid, User, PlusCircle } from "lucide-react";

interface Order {
  id: number;
  type: string;
  person: string;
  description: string;
  date: string;
  doc_number: string;
  value: string;
  event?: string | null;
}

type FiltersType = {
  type: string[];
  startDate: string;
  endDate: string;
  person: string;
  description: string;
  minValue: string;
  maxValue: string;
};

interface Event {
  id: number;
  event_name: string;
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

const TableComponent: React.FC<{ data: Order[]; title: string; onOrderCreated: () => void }> = ({ data, title, onOrderCreated }) => {
  const { register, handleSubmit, reset } = useForm<Order>();
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltersType>({
      startDate: "",
      endDate: "",
      person: "",
      description: "",
      type: ["Despesa", "Receita"],
      minValue: "",
      maxValue: ""
    });
  const itemsPerPage = 13;
  
    useEffect(() => {
      localStorage.setItem("savedFilters", JSON.stringify(filters));
    }, [filters]);
  
    const applyFilters = (newFilters: FiltersType) => {
      setFilters(newFilters);
      setFilterOpen(false);
      setCurrentPage(1);
    };
  
  
    const clearFilters = () => {
      setFilters({
        startDate: "",
        endDate: "",
        person: "",
        description: "",
        type: ["Despesa", "Receita"],
        minValue: "",
        maxValue: ""
      });
      localStorage.removeItem("savedFilters");
    };
    
    const filteredData = (data && data.length > 0) ? data.filter((order) => {
      return (
        (!filters.startDate || new Date(order.date) >= new Date(filters.startDate)) &&
        (!filters.endDate || new Date(order.date) <= new Date(filters.endDate)) &&
        (!filters.person || order.person.toLowerCase().includes(filters.person.toLowerCase())) &&
        (!filters.description || order.description.toLowerCase().includes(filters.description.toLowerCase())) &&
        (filters.type.length === 0 || filters.type.includes(order.type)) &&
        (!filters.minValue || parseFloat(order.value) >= parseFloat(filters.minValue)) &&
        (!filters.maxValue || parseFloat(order.value) <= parseFloat(filters.maxValue))
      );
    }) : []; // 👈 Returns an empty array instead of undefined
    

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
      setEvents(result.events);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onSubmit = async (formData: Order) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/orders/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar ordem de pagamento");
      }

      onOrderCreated();
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Erro ao criar ordem de pagamento:", error);
    }
  };

  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4">
          <Button onClick={() => setFilterOpen(true)}>Filtros Avançados</Button>
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <PlusCircle size={18} /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Dialog for Advanced Filters */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtros Avançados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="date" placeholder="Data Inicial" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
            <Input type="date" placeholder="Data Final" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
            <Input placeholder="Pessoa" value={filters.person} onChange={(e) => setFilters({...filters, person: e.target.value})} />
            <Input placeholder="Descrição" value={filters.description} onChange={(e) => setFilters({...filters, description: e.target.value})} />
            <Input type="number" placeholder="Valor Mínimo" value={filters.minValue} onChange={(e) => setFilters({...filters, minValue: e.target.value})} />
            <Input type="number" placeholder="Valor Máximo" value={filters.maxValue} onChange={(e) => setFilters({...filters, maxValue: e.target.value})} />
            <div className="border p-2 rounded-md bg-white shadow-md">
              <label className="block font-semibold mb-2">Tipo</label>
              <div className="flex flex-row">
                {["Despesa", "Receita"].map((type) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer mr-5">
                    <input
                      type="checkbox"
                      checked={filters.type?.includes(type) ?? false} // ✅ Prevents undefined.includes()
                      onChange={() => {
                        setFilters((prevFilters) => ({
                          ...prevFilters,
                          type: prevFilters.type?.includes(type)
                            ? (prevFilters.type.filter((s) => s !== type) as string[])
                            : ([...(prevFilters.type ?? []), type] as string[]), // ✅ Prevents undefined
                        }));
                      }}
                    />
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </label>
                ))}
              </div>
              </div>
          </div>
          <DialogFooter>
            <Button onClick={clearFilters} variant="outline">Limpar Filtros</Button>
            <Button onClick={() => applyFilters(filters)}>Aplicar Filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <select {...register("type", { required: true })} className="p-2 border rounded w-full">
              <option value="">Selecione um Tipo</option>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
            <Input placeholder="Pessoa" {...register("person", { required: true })} />
            <Input placeholder="Descrição" {...register("description", { required: true })} />
            <Input type="date" {...register("date", { required: true })} />
            <Input placeholder="Número do Documento" {...register("doc_number", { required: true })} />
            <Input type="number" placeholder="Valor" {...register("value", { required: true })} />
            <select {...register("event")} className="p-2 border rounded w-full">
              <option value="">Sem Evento</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.event_name}</option>
              ))}
            </select>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="ml-2">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Tipo</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Pessoa</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Número do Documento</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedData.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.type}</TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>{order.person}</TableCell>
              <TableCell>{order.description}</TableCell>
              <TableCell>{order.doc_number}</TableCell>
              <TableCell> R$ {order.value}</TableCell>
              <TableCell>
                <Button variant="outline">Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      <div className="flex justify-center mt-4">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          ⬅️
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          ➡️
        </button>
      </div>
    </div>
  );
};


export default function Page() {
  const [data, setData] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/orders/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar ordens de pagamento");
      }

      const result = await response.json();
      setData(result.orders);
    } catch (error) {
      console.error("Erro ao buscar ordens de pagamento:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent data={data} title="Lançamentos" onOrderCreated={fetchOrders} />
      </div>
    </div>
  );
}
