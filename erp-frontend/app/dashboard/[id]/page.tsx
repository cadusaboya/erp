"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { LayoutGrid, ArrowLeft, FileText } from "lucide-react";

interface Event {
  id: number;
  event_name: string;
  date: string;
  client_name: string;
  total_value: number;
}

interface Bill {
  id: number;
  description: string;
  person: number;
  person_name: string;
  value: number;
  date_due: string;
  status: string;
}

interface Income {
  id: number;
  description: string;
  person: number;
  person_name: string;
  value: number;
  date_due: string;
  status: string;
}

interface FinancialSummary {
  total_receitas: number;
  total_despesas: number;
  saldo_evento: number;
  valor_restante_pagar: number;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export default function EventDashboard({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token não encontrado");
        }

        const response = await fetch(`${API_BASE_URL}/events/view/${params.id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar evento");
        }

        const result = await response.json();
        setEvent(result.event);
        setBills(result.bills);
        setIncomes(result.incomes);
        setFinancialSummary(result.financial_summary);
      } catch (error) {
        console.error("Erro ao buscar evento:", error);
      }
    };

    fetchEventData();
  }, [params.id]);

  const handleDownloadPDF = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token não encontrado");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/events/${params.id}/pdf/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar o PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evento_${params.id}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
    }
  };

  if (!event || !financialSummary) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutGrid size={24} /> {event.event_name}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <FileText size={18} className="mr-2" /> Baixar PDF
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft size={18} className="mr-2" /> Voltar
          </Button>
        </div>
      </div>

      {/* Event Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalhes do Evento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <p><strong>Nome:</strong> {event.event_name}</p>
          <p><strong>Cliente:</strong> {event.client_name}</p>
          <p><strong>Data:</strong> {event.date}</p>
          <p><strong>Valor Total:</strong> R$ {Number(event.total_value).toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <p><strong>Receitas:</strong> R$ {Number(financialSummary.total_receitas).toFixed(2)}</p>
          <p><strong>Despesas:</strong> R$ {Number(financialSummary.total_despesas).toFixed(2)}</p>
          <p><strong>Saldo do Evento:</strong> R$ {Number(financialSummary.saldo_evento).toFixed(2)}</p>
          <p><strong>Valor Pendente:</strong> R$ {Number(financialSummary.valor_restante_pagar).toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Receitas (Contas a Receber) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Pessoa</TableCell>
                  <TableCell>Descrição</TableCell>     
                  <TableCell>Valor</TableCell>
                </TableRow>
              </TableHeader>
              <tbody>
                {incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{income.date_due}</TableCell>
                    <TableCell>{income.person_name}</TableCell>
                    <TableCell>{income.description}</TableCell>  
                    <TableCell className="text-green-500">R$ {Number(income.value).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-gray-500">Nenhuma receita registrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Despesas (Contas a Pagar) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {bills.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Pessoa</TableCell>
                  <TableCell>Descrição</TableCell>     
                  <TableCell>Valor</TableCell>
                </TableRow>
              </TableHeader>
              <tbody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.date_due}</TableCell>
                    <TableCell>{bill.person_name}</TableCell>
                    <TableCell>{bill.description}</TableCell>  
                    <TableCell className="text-red-500">R$ {Number(bill.value).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-gray-500">Nenhuma despesa registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
