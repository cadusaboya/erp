"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";

export default function ReportsPage() {
  const [type, setType] = useState("both");
  const [status, setStatus] = useState("");
  const [person, setPerson] = useState("");
  const [eventId, setEventId] = useState("");
  const [dateMin, setDateMin] = useState("");
  const [dateMax, setDateMax] = useState("");
  const [year, setYear] = useState("");

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");
    return token;
  };

    const handleGenerateTypeReport = async () => {
    if (!year) {
        alert("Por favor, selecione um ano.");
        return;
    }

    const params = new URLSearchParams({ year });

    try {
        const token = getToken();
        const response = await fetch(`http://127.0.0.1:8000/events/report/type/?${params.toString()}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });

        if (!response.ok) throw new Error("Erro ao gerar o relatório");

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `receita_por_tipo_${year}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
        console.error("Erro ao baixar relatório por tipo:", err);
        alert("Não foi possível gerar o relatório. Tente novamente.");
    }
    };

  const handleGenerateReport = async () => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (person) params.append("person", person);
    if (eventId) params.append("event_id", eventId);
    if (dateMin) params.append("date_min", dateMin);
    if (dateMax) params.append("date_max", dateMax);
  
    const url = `http://127.0.0.1:8000/payments/report/?${params.toString()}`;
  
    try {
        const token = getToken();
      const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        }
      });
  
      if (!response.ok) {
        throw new Error("Erro ao gerar o relatório");
      }
  
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "relatorio_contas.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar o PDF:", error);
      alert("Não foi possível gerar o relatório. Tente novamente.");
    }
  };
  

  return (
    <div className="flex">
      <Sidebar />
        <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">Gerar Relatórios de Contas</h1>

        <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div>
                <label className="text-sm">Tipo de Contas</label>
                <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="both">Receitas e Despesas</SelectItem>
                    <SelectItem value="bills">Despesas</SelectItem>
                    <SelectItem value="incomes">Receitas</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div>
                <label className="text-sm">Pessoa (ID)</label>
                <Input placeholder="ID da pessoa" value={person} onChange={(e) => setPerson(e.target.value)} />
            </div>

            <div>
                <label className="text-sm">Evento (ID)</label>
                <Input placeholder="ID do evento" value={eventId} onChange={(e) => setEventId(e.target.value)} />
            </div>

            <div>
                <label className="text-sm">Status</label>
                <Select value={status} onValueChange={(value) => setStatus(value)}>
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="todos">Lançamentos</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="em aberto">A Pagar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <label className="text-sm">Data Inicial</label>
                <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} />
            </div>

            <div>
                <label className="text-sm">Data Final</label>
                <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} />
            </div>
            </CardContent>
            </Card>

            <div>
                <Button onClick={handleGenerateReport} className="w-full md:w-auto">
                Gerar Relatório PDF
                </Button>
            </div>
        </div>
        <div className="mt-8">
            <h2 className="text-xl font-semibold">Relatório de Receita por Tipo de Evento</h2>

            <Card className="mt-4">
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div>
                    <label className="text-sm">Ano</label>
                    <Input
                    type="number"
                    placeholder="Ex: 2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    />
                </div>

                <div className="flex items-end">
                    <Button onClick={handleGenerateTypeReport} className="w-full md:w-auto">
                    Gerar Relatório PDF
                    </Button>
                </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
