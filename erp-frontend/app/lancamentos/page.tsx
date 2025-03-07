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

  const onSubmit = async (formData: Order) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch("http://127.0.0.1:8000/orders/create/", {
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

      onOrderCreated(); // Trigger a refetch after creation
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Erro ao criar ordem de pagamento:", error);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} /> Nova Ordem de Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Ordem de Pagamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Input placeholder="Tipo" {...register("type", { required: true })} />
              <Input placeholder="Pessoa" {...register("person", { required: true })} />
              <Input placeholder="Descrição" {...register("description", { required: true })} />
              <Input type="date" {...register("date", { required: true })} />
              <Input placeholder="Número do Documento" {...register("doc_number", { required: true })} />
              <Input type="number" placeholder="Valor" {...register("value", { required: true })} />
              <Input placeholder="Evento (opcional)" {...register("event")} />
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
            <TableCell>Tipo</TableCell>
            <TableCell>Pessoa</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Número do Documento</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Evento</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {data.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{order.type}</TableCell>
              <TableCell>{order.person}</TableCell>
              <TableCell>{order.description}</TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>{order.doc_number}</TableCell>
              <TableCell> R$ {order.value}</TableCell>
              <TableCell>{order.event || "N/A"}</TableCell>
              <TableCell>
                <Button variant="outline">Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
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

      const response = await fetch("http://127.0.0.1:8000/orders/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar ordens de pagamento");
      }

      const result = await response.json();
      setData([...result.orders]);
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
        <TableComponent data={data} title="Ordens de Pagamento" onOrderCreated={fetchOrders} />
      </div>
    </div>
  );
}
