"use client";

import { useState, useEffect } from "react";
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
  const [costCenter, setCostCenter] = useState("");
  const [costCenters, setCostCenters] = useState([]);

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");
    return token;
  };

  useEffect(() => {
    const fetchCostCenters = async () => {
      try {
        const token = getToken();
        const response = await fetch("http://127.0.0.1:8000/payments/costcenter/", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao buscar centros de custo");
        const data = await response.json();
        setCostCenters(data);
      } catch (error) {
        console.error("Erro ao carregar centros de custo:", error);
      }
    };
    fetchCostCenters();
  }, []);

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
        headers: { Authorization: `Bearer ${token}` },
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
    if (costCenter && costCenter !== "todos") params.append("cost_center", costCenter);
    if (dateMin) params.append("date_min", dateMin);
    if (dateMax) params.append("date_max", dateMax);

    const url = `http://127.0.0.1:8000/payments/report/?${params.toString()}`;
    try {
      const token = getToken();
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao gerar o relatório");
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

  const handleGenerateCostCenterConsolidated = async () => {
    const params = new URLSearchParams();
    if (dateMin) params.append("date_min", dateMin);
    if (dateMax) params.append("date_max", dateMax);
    if (status && status !== "todos") params.append("status", status);
    if (type) params.append("type", type);

    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/payments/report/costcenter/?${params.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao gerar o relatório consolidado");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `relatorio_consolidado_centros.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar o relatório consolidado:", error);
      alert("Não foi possível gerar o relatório. Tente novamente.");
    }
  };

  const handleGenerateChartAccountBalance = async () => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (dateMin) params.append("date_min", dateMin);
    if (dateMax) params.append("date_max", dateMax);

    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/payments/report/chartaccount/?${params.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao gerar o balancete");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "balancete_plano_contas.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar o balancete:", error);
      alert("Não foi possível gerar o balancete. Tente novamente.");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex flex-col gap-6 p-6">

        {/* --- Relatório de Contas --- */}
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
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Lançamentos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="em_aberto">A Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm">Centro de Custo</label>
              <Select value={costCenter} onValueChange={setCostCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Centro de Custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Centros de Custo</SelectItem>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={String(cc.id)}>
                      {cc.name}
                    </SelectItem>
                  ))}
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

        {/* --- Receita por Tipo --- */}
        <h2 className="text-xl font-semibold mt-8">Relatório de Receita por Tipo de Evento</h2>
        <Card className="mt-4">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div>
              <label className="text-sm">Ano</label>
              <Input type="number" placeholder="Ex: 2024" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateTypeReport} className="w-full md:w-auto">
                Gerar Relatório PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- Consolidado por Centro de Custo --- */}
        <h2 className="text-xl font-semibold mt-8">Relatório Consolidado por Centro de Custo</h2>
        <Card className="mt-4">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div>
              <label className="text-sm">Tipo de Contas</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bills">Despesas</SelectItem>
                  <SelectItem value="incomes">Receitas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="em_aberto">Em Aberto</SelectItem>
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
          <Button onClick={handleGenerateCostCenterConsolidated} className="w-full md:w-auto mt-4">
            Gerar Relatório Consolidado
          </Button>
        </div>

        {/* --- Balancete Plano de Contas --- */}
        <h2 className="text-xl font-semibold mt-8">Balancete por Plano de Contas</h2>
        <Card className="mt-4">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div>
              <label className="text-sm">Data Inicial</label>
              <Input
                type="date"
                value={dateMin}
                onChange={(e) => setDateMin(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm">Data Final</label>
              <Input
                type="date"
                value={dateMax}
                onChange={(e) => setDateMax(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <Button onClick={handleGenerateChartAccountBalance} className="w-full md:w-auto mt-4">
            Gerar Balancete
          </Button>
        </div>


      </div>
    </div>
  );
}
