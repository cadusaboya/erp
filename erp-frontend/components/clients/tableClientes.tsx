"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import EditClientDialog from "@/components/clients/EditClientDialog";
import CreateClientDialog from "./CreateClientDialog";

interface Client {
    id: number;
    name: string;
    email: string;
    telephone: string;
    address: string;
    cpf_cnpj: string;
  }

interface TableComponentProps {
    data: Client[];
    title: string;
    onClientCreated: () => void;
  }
  
const TableComponent: React.FC<TableComponentProps> = ({ data, title, onClientCreated }) => {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const handleEditClick = (client: Client) => {
      setSelectedClient(client);
      setEditOpen(true);
    };
  
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
          <PlusCircle size={18} /> Novo Cliente
        </Button>
      </div>

      <CreateClientDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onClientCreated={onClientCreated}
      />
      
      <EditClientDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onClientUpdated={onClientCreated}
        client={selectedClient}
      />

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
                <Button variant="outline" onClick={() => handleEditClick(client)}>Editar</Button>
              </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  export default TableComponent;