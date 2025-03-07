"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Menu, LayoutGrid, User, PlusCircle } from "lucide-react";

interface Client {
  id: number;
  name: string;
  email: string;
  telephone: string;
  address: string;
  cpf_cnpj: string;
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

interface TableComponentProps {
  data: Client[];
  title: string;
}

const TableComponent: React.FC<TableComponentProps> = ({ data, title }) => {
  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button className="flex items-center gap-2">
          <PlusCircle size={18} /> Novo Cliente
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Endereço</TableCell>
            <TableCell>CPF/CNPJ</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {data.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.id}</TableCell>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.telephone}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>{client.cpf_cnpj}</TableCell>
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
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token não encontrado");
        }

        const response = await fetch("http://127.0.0.1:8000/clients/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar clientes");
        }

        const result = await response.json();
        setData(result.clients);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        {loading ? <p>Carregando clientes...</p> : <TableComponent data={data} title="Clientes" />}
      </div>
    </div>
  );
}