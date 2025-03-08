"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, LayoutGrid, User, PlusCircle } from "lucide-react";

interface Income {
  id: number;
  person: string;
  description: string;
  date_due: string;
  value: string;
  doc_number?: string;
  event?: string | null;
  status: "em aberto" | "pago" | "vencido";
}

type FiltersType = {
  startDate: string;
  endDate: string;
  person: string;
  description: string;
  status: string[];
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
          <a key={item.name} href={item.href}>
            <div className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer">
              {item.icon} <span>{item.name}</span>
            </div>
          </a>
        ))}
      </nav>
    </div>
  );
};

const TableComponent: React.FC<{ data: Income[]; title: string; onIncomeCreated: () => void }> = ({ data, title, onIncomeCreated }) => {
  const { register, handleSubmit, reset } = useForm<Income>();
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltersType>({
    startDate: "",
    endDate: "",
    person: "",
    description: "",
    status: ["em aberto", "vencido", "pago"],
    minValue: "",
    maxValue: ""
  });
  
  const itemsPerPage = 13;

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
      status: ["em aberto", "vencido", "pago"],
      minValue: "",
      maxValue: ""
    });
    localStorage.removeItem("savedFilters");
  };

  const handleCreateIncome = async (formData: Income) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/orders/incomes/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar recebimento");
      }

      onIncomeCreated();
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Erro ao criar recebimento:", error);
    }
  };

  const filteredData = data.filter((income) => {
    return (
      (!filters.startDate || new Date(income.date_due) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(income.date_due) <= new Date(filters.endDate)) &&
      (!filters.person || income.person.toLowerCase().includes(filters.person.toLowerCase())) &&
      (!filters.description || income.description.toLowerCase().includes(filters.description.toLowerCase())) &&
      (filters.status.length === 0 || filters.status.includes(income.status)) &&  // <-- Ensure this condition is added
      (!filters.minValue || parseFloat(income.value) >= parseFloat(filters.minValue)) &&
      (!filters.maxValue || parseFloat(income.value) <= parseFloat(filters.maxValue))
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-4">
          <Button onClick={() => setFilterOpen(true)}>Filtros Avançados</Button>
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <PlusCircle size={18} /> Novo Recebimento
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
                          status: Array.isArray(prevFilters.status)
                            ? (
                              prevFilters.status.includes(status)
                                ? prevFilters.status.filter((s) => s !== status)
                                : [...prevFilters.status, status]
                            ) : [status] // Ensure it's an array
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
            <Button onClick={clearFilters} variant="outline">Limpar Filtros</Button>
            <Button onClick={() => applyFilters(filters)}>Aplicar Filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Adding New Recebimento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Recebimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateIncome)} className="space-y-3">
            <Input placeholder="Pessoa (Nome)" {...register("person", { required: true })} />
            <Input placeholder="Descrição" {...register("description", { required: true })} />
            <Input type="date" {...register("date_due", { required: true })} />
            <Input type="number" placeholder="Valor" {...register("value", { required: true })} />
            <Input placeholder="Número do Documento" {...register("doc_number")} />
            <select {...register("event")} className="p-2 border rounded w-full">
              <option value="">Sem Evento</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.event_name}</option>
              ))}
            </select>
            <select {...register("status")} className="p-2 border rounded w-full">
              <option value="em aberto">Em Aberto</option>
              <option value="pago">Pago</option>
            </select>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Table with Pagination */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Data de Vencimento</TableCell>
            <TableCell>Pessoa</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Número do Documento</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Valor</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedData.map((income) => (
            <TableRow key={income.id}>
              <TableCell>{income.date_due}</TableCell>
              <TableCell>{income.person}</TableCell>
              <TableCell>{income.description}</TableCell>
              <TableCell>{income.doc_number || "N/A"}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                    income.status === "vencido"
                      ? "bg-red-100 text-red-600"
                      : income.status === "pago"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {income.status.charAt(0).toUpperCase() + income.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>R$ {income.value}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      
      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 gap-4">
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
  const [data, setData] = useState<Income[]>([]);

  const fetchIncomes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/orders/incomes/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar recebimentos");
      }

      const result = await response.json();
      setData(result.incomes);
    } catch (error) {
      console.error("Erro ao buscar recebimentos:", error);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent title="Contas a Receber" data={data} onIncomeCreated={fetchIncomes} />
      </div>
    </div>
  );
}
