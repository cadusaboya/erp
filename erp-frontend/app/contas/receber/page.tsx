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
  status: "open" | "received";
}

const Sidebar: React.FC = () => {
  const menuItems = [
    { name: "Eventos", href: "/dashboard", icon: <LayoutGrid size={20} /> },
    { name: "Clientes", href: "/clientes", icon: <User size={20} /> },
    { name: "Lançamentos", href: "/lancamentos", icon: <Menu size={20} /> },
    { name: "Contas a Pagar", href: "/contas", icon: <Menu size={20} /> },
    { name: "Contas a Receber", href: "/contas/receber", icon: <Menu size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-6">ERP Dashboard</h1>
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

  const onSubmit = async (formData: Income) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`http://127.0.0.1:8000/orders/incomes/create/`, {
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

      onIncomeCreated(); // Trigger a refetch after creation
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Erro ao criar recebimento:", error);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} /> Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Recebimento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Input placeholder="Pessoa (ID)" {...register("person", { required: true })} />
              <Input placeholder="Descrição" {...register("description", { required: true })} />
              <Input type="date" {...register("date_due", { required: true })} />
              <Input type="number" placeholder="Valor" {...register("value", { required: true })} />
              <Input placeholder="Número do Documento" {...register("doc_number")} />
              <Input placeholder="Evento (opcional)" {...register("event")} />
              <select {...register("status")} className="p-2 border rounded w-full">
                <option value="open">Aberto</option>
                <option value="received">Recebido</option>
              </select>
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
            <TableCell>ID</TableCell>
            <TableCell>Pessoa</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Data de Vencimento</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Número do Documento</TableCell>
            <TableCell>Evento</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {data.map((income) => (
            <TableRow key={income.id}>
              <TableCell>{income.id}</TableCell>
              <TableCell>{income.person}</TableCell>
              <TableCell>{income.description}</TableCell>
              <TableCell>{income.date_due}</TableCell>
              <TableCell>R$ {income.value}</TableCell>
              <TableCell>{income.doc_number || "N/A"}</TableCell>
              <TableCell>{income.event || "N/A"}</TableCell>
              <TableCell className={income.status === "received" ? "text-green-500" : "text-yellow-500"}>
                {income.status.toUpperCase()}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
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

      const response = await fetch("http://127.0.0.1:8000/orders/incomes/", {
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
