"use client";

import { useState } from "react";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, Repeat } from "lucide-react";
import CreateBankDialog from "@/components/banks/CreateBankDialog";
import EditBankDialog from "@/components/banks/EditBankDialog";
import TransferDialog from "@/components/banks/TransferDialog"; // 👈 you'll create this soon
import { Bank } from "@/types/types";
import { formatCurrencyBR } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface TableBanksProps {
  banks: Bank[];
  onBankUpdated: () => void;
}

const TableBanks: React.FC<TableBanksProps> = ({ banks, onBankUpdated }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false); // 👈 new state
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Contas Bancárias</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setTransferOpen(true)}>
            <Repeat size={18} /> Transferir Entre Bancos
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle size={18} /> Nova Conta
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <CreateBankDialog open={createOpen} onClose={() => setCreateOpen(false)} onBankCreated={onBankUpdated} />
      <EditBankDialog open={editOpen} onClose={() => setEditOpen(false)} onBankUpdated={onBankUpdated} bank={selectedBank} />
      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} banks={banks} onTransferCreated={onBankUpdated} />

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
              <TableCell>{formatCurrencyBR(bank.balance)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        setTimeout(() => {
                          setSelectedBank(bank);
                          setEditOpen(true);
                        }, 0)
                      }
                    >
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TableBanks;
