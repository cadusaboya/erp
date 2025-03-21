"use client";

import { useState } from "react";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import CreateBankDialog from "@/components/banks/CreateBankDialog";
import EditBankDialog from "@/components/banks/EditBankDialog";
import { Bank } from "@/types/types";

interface TableBanksProps {
  banks: Bank[];
  onBankUpdated: () => void;
}

const TableBanks: React.FC<TableBanksProps> = ({ banks, onBankUpdated }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Contas Bancárias</h2>
        <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
          <PlusCircle size={18} /> Nova Conta
        </Button>
      </div>

      <CreateBankDialog open={createOpen} onClose={() => setCreateOpen(false)} onBankCreated={onBankUpdated} />

      <EditBankDialog open={editOpen} onClose={() => setEditOpen(false)} onBankUpdated={onBankUpdated} bank={selectedBank} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Saldo</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {banks.map((bank) => (
            <TableRow key={bank.id}>
              <TableCell>{bank.id}</TableCell>
              <TableCell>{bank.name}</TableCell>
              <TableCell>R$ {bank.balance}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBank(bank);
                    setEditOpen(true);
                  }}
                >
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TableBanks;
