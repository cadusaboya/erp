"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { Event, FinancialSummary, FinanceRecord } from "@/types/types";
import { formatCurrencyBR } from "@/lib/utils";
import { API_URL } from "@/types/apiUrl";
import { api } from "@/lib/axios";

interface EventDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
}

export default function EventDetailsDialog({ open, onClose, eventId }: EventDetailsDialogProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [bills, setBills] = useState<FinanceRecord[]>([]);
  const [incomes, setIncomes] = useState<FinanceRecord[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchEventData = async () => {
      try {
        const [eventRes, paymentRes] = await Promise.all([
          api.get(`/events/view/${eventId}/`),
          api.get(`/payments/event-allocations/${eventId}/`)
        ]);

        const eventData = eventRes.data;
        const paymentData = paymentRes.data;

        setEvent(eventData.event);
        setFinancialSummary({
          total_despesas: paymentData.total_despesas,
          total_receitas: paymentData.total_receitas,
          saldo_evento: paymentData.saldo_evento,
          valor_restante_pagar: Number(eventData.event.total_value) - paymentData.total_receitas,
        });
        setIncomes(paymentData.payments_incomes || []);
        setBills(paymentData.payments_bills || []);
      } catch (error) {
        console.error("Erro ao buscar dados do evento:", error);
      }
    };

    fetchEventData();
  }, [eventId, open]);

  const handleDownload = async (url: string, filename: string) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Token não encontrado");

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Erro ao gerar o PDF");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {event?.event_name || "Carregando..."}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() =>
                  handleDownload(
                    `${API_URL}/payments/report/?type=both&status=pago&event_id=${eventId}`,
                    `evento_${eventId}_pagamentos.pdf`
                  )
                }
              >
                <FileText size={18} className="mr-2" /> Pagamentos
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  handleDownload(
                    `${API_URL}/payments/report/?type=both&status=todos&event_id=${eventId}`,
                    `evento_${eventId}_contas.pdf`
                  )
                }
              >
                <FileText size={18} className="mr-2" /> Contas
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  handleDownload(
                    `${API_URL}/payments/report/?type=em+aberto&status=todos&event_id=${eventId}`,
                    `evento_${eventId}_pendentes.pdf`
                  )
                }
              >
                <FileText size={18} className="mr-2" /> Contas Pendentes
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {event && financialSummary && (
          <>
            {/* 🔵 Card de Detalhes do Evento */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Detalhes do Evento</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Nome do Evento</p>
                  <p className="font-medium">{event.event_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Cliente</p>
                  <p className="font-medium">{event.client_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Tipo</p>
                  <p className="font-medium capitalize">{event.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Data Inicial</p>
                  <p className="font-medium">{new Date(event.date).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Data Final</p>
                  <p className="font-medium">
                    {event.date_end ? new Date(event.date_end).toLocaleDateString("pt-BR") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Valor Total</p>
                  <p className="font-medium">{formatCurrencyBR(event.total_value)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Local</p>
                  <p className="font-medium">{event.local || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Documento Fiscal</p>
                  <p className="font-medium">{event.fiscal_doc || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* 🟢 Resumo Financeiro */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <p><strong>Receitas:</strong> {formatCurrencyBR(financialSummary.total_receitas)}</p>
                <p><strong>Despesas:</strong> {formatCurrencyBR(financialSummary.total_despesas)}</p>
                <p><strong>Saldo:</strong> {formatCurrencyBR(financialSummary.saldo_evento)}</p>
                <p><strong>Valor Pendente:</strong> {formatCurrencyBR(financialSummary.valor_restante_pagar)}</p>
              </CardContent>
            </Card>

            {/* 🟦 Receitas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Receitas (Pagamentos Recebidos)</CardTitle>
              </CardHeader>
              <CardContent>
                {incomes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Valor</TableCell>
                      </TableRow>
                    </TableHeader>
                    <tbody>
                      {incomes.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.date ?? "").toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell className="text-green-600">{formatCurrencyBR(payment.value)}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                ) : <p className="text-gray-500">Nenhum pagamento recebido.</p>}
              </CardContent>
            </Card>

            {/* 🟥 Despesas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Despesas (Pagamentos Realizados)</CardTitle>
              </CardHeader>
              <CardContent>
                {bills.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Valor</TableCell>
                      </TableRow>
                    </TableHeader>
                    <tbody>
                      {bills.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.date ?? "").toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell className="text-red-600">{formatCurrencyBR(payment.value)}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                ) : <p className="text-gray-500">Nenhuma despesa paga.</p>}
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
