"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { searchEvents } from "@/services/events";
import { searchResources } from "@/services/resources";
import { API_URL } from "@/types/apiUrl";
import { Event, Resource, Bank, CostCenter } from "@/types/types";
import { api } from "@/lib/axios";   // ✅ ADD THIS
import { transformDates } from "@/lib/dateFormat";

const withAllOption = (options: { label: string; value: string }[]) => [
  { label: "*", value: "" },
  ...options,
];

export default function ReportsPage() {
  const [type, setType] = useState("bills");
  const [status, setStatus] = useState("");
  const [person, setPerson] = useState("");
  const [eventId, setEventId] = useState("");
  const [dateMin, setDateMin] = useState("");
  const [dateMax, setDateMax] = useState("");
  const [year, setYear] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [bankId, setBankId] = useState("");
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Resource[]>([]);
  const [suppliers, setSuppliers] = useState<Resource[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [reportType, setReportType] = useState("espelho")
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costCentersRes, banksRes, eventsRes, clientsRes, suppliersRes] = await Promise.all([
          api.get("/payments/costcenter/"),
          api.get("/payments/banks/"),
          api.get("/events/"),
          api.get("/clients/clients/"),
          api.get("/clients/suppliers/"),
        ]);
  
        setCostCenters(costCentersRes.data);
        setBanks(banksRes.data);
        setEvents(eventsRes.data.results || []);
        setClients(clientsRes.data.results || []);
        setSuppliers(suppliersRes.data.results || []);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };
    fetchData();
  }, []);
  

  const buildParams = (extraParams: Record<string, string> = {}) => {
    const rawParams = {
      type,
      status: status !== "todos" ? status : "",
      person,
      event_id: eventId,
      cost_center: costCenter !== "todos" ? costCenter : "",
      date_min: dateMin,
      date_max: dateMax,
      ...extraParams,
    };
  
    const transformed = transformDates(rawParams);
    const params = new URLSearchParams();
  
    Object.entries(transformed).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  
    return params;
  };

  const handleOpenPdf = async (url: string) => {
    try {
      setIsLoading(true);
  
      // ✅ Axios + blob + X-Company-ID + Authorization
      const res = await api.get(url, { responseType: "blob" });
      const blob = res.data;
  
      const pdfUrl = window.URL.createObjectURL(blob);
  
      // Open the PDF in a new browser tab
      window.open(pdfUrl, "_blank");
  
      // Optional: revoke the object URL later to avoid memory leaks
      setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 10000); // after 10 seconds
    } catch (error) {
      console.error("Erro ao gerar relatório", error);
    } finally {
      setIsLoading(false);
    }
  };

  const people =
  type === "incomes"
    ? clients
    : type === "bills"
    ? suppliers
    : [];

  const options = (people as Array<{ id: number; name: string }>).map((p) => ({
    label: p.name,
    value: String(p.id),
  }));
  

  return (
    <div className="flex">
      <div className="flex flex-col p-6 gap-6 w-full">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Tabs
          defaultValue="contas"
          className="w-full"
          onValueChange={() => {
            setType("");
            setStatus("");
            setPerson("");
            setEventId("");
            setDateMin("");
            setDateMax("");
            setYear("");
            setCostCenter("");
            setBankId("");
          }}
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 mb-10">
            <TabsTrigger value="contas">Contas</TabsTrigger>
            <TabsTrigger value="tipo">Receita por Tipo</TabsTrigger>
            <TabsTrigger value="custo">Centros de Custo</TabsTrigger>
            <TabsTrigger value="evento">Resumo Eventos</TabsTrigger>
            <TabsTrigger value="banco">Extrato Bancário</TabsTrigger>
            <TabsTrigger value="balancete">Balancete</TabsTrigger>
            <TabsTrigger value="quadro">Quadro</TabsTrigger>
          </TabsList>

          {/* Contas */}
          <TabsContent value="contas">
            <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs">Tipo</label>
                <Select value={type} onValueChange={(value) => {
                    setType(value);
                    setPerson("");
                  }} >
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Receitas e Despesas</SelectItem>
                    <SelectItem value="bills">Despesas</SelectItem>
                    <SelectItem value="incomes">Receitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pessoa */}
              <div className="flex flex-col gap-1 w-fit">
                <label className="text-xs">Pessoa</label>
                <Combobox
                  disabled={type === "both"}
                  options={withAllOption(options)}
                  loadOptions={async (query) => {
                    const results = await searchResources(type === "incomes" ? "clients" : "suppliers", query);
                    return withAllOption(results);
                  }}
                  value={person}
                  onChange={setPerson}
                  placeholder={
                    type === "both" ? "Desativado para Receitas e Despesas" : "Selecione uma pessoa"
                  }
                />
              </div>

              {/* Evento */}
              <div className="flex flex-col gap-1 w-fit">
                <label className="text-xs">Evento</label>
                <Combobox
                  options={withAllOption(events.map(ev => ({
                    label: ev.event_name,
                    value: String(ev.id),
                  })))}
                  loadOptions={async (query) => {
                    const results = await searchEvents(query);
                    return withAllOption(results);
                  }}
                  value={eventId}
                  onChange={setEventId}
                  placeholder="Selecione um evento"
                />

              </div>
              
              <div>
                <label className="text-xs">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="em aberto">A Pagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs">Data Inicial</label>
                <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="max-w-[150px]" />
              </div>
              <div>
                <label className="text-xs">Data Final</label>
                <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="max-w-[150px]" />
              </div>
              <div>
                <label className="text-xs">Centro de Custo</label>
                <Select value={costCenter} onValueChange={setCostCenter}>
                  <SelectTrigger><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {costCenters.map(cc => (
                      <SelectItem key={cc.id} value={String(cc.id)}>{cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent></Card>
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <Button onClick={() => handleOpenPdf(`${API_URL}/payments/report/?${buildParams().toString()}`)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Relatório"}
              </Button>
            </div>
          </TabsContent>

          {/* Receita por Tipo */}
          <TabsContent value="tipo">
            <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs">Ano</label>
                <Input type="number" placeholder="Ex: 2025" value={year} onChange={(e) => setYear(e.target.value)} className="max-w-[150px]" />
              </div>
            </CardContent></Card>
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <Button onClick={() => handleOpenPdf(`${API_URL}/events/report/type/?year=${year}`)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Relatório"}
              </Button>
            </div>
          </TabsContent>

          {/* Consolidado Centros */}
          <TabsContent value="custo">
            <Card><CardContent className="p-4 grid gap-2">
              <div>
                <label className="text-xs">Tipo</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bills">Despesas</SelectItem>
                    <SelectItem value="incomes">Receitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs">Data Inicial</label>
                <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="max-w-[150px]" />
              </div>
              <div>
                <label className="text-xs">Data Final</label>
                <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="max-w-[150px]" />
              </div>
            </CardContent></Card>
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <Button onClick={() => handleOpenPdf(`${API_URL}/payments/report/costcenter/?${buildParams().toString()}`)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Relatório"}
              </Button>
            </div>
          </TabsContent>

          {/* Resumo Eventos */}
          <TabsContent value="evento">
            <Card><CardContent className="p-4 grid gap-2">
              <div>
                <label className="text-xs">Data Inicial</label>
                <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="max-w-[150px]" />
              </div>
              <div>
                <label className="text-xs">Data Final</label>
                <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="max-w-[150px]" />
              </div>
            </CardContent></Card>
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <Button onClick={() => handleOpenPdf(`${API_URL}/events/report/?${buildParams().toString()}`)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Relatório"}
              </Button>
            </div>
          </TabsContent>

          {/* Extrato Bancário */}
          <TabsContent value="banco">
            <Card><CardContent className="p-4 grid gap-2">
              <div>
                <label className="text-xs">Banco</label>
                <Select value={bankId} onValueChange={setBankId}>
                  <SelectTrigger><SelectValue placeholder="Banco" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {banks.map(bank => (
                      <SelectItem key={bank.id} value={String(bank.id)}>{bank.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs">Data Inicial</label>
                <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="max-w-[150px]" />
              </div>
              <div>
                <label className="text-xs">Data Final</label>
                <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="max-w-[150px]" />
              </div>
            </CardContent></Card>
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <Button onClick={() => handleOpenPdf(`${API_URL}/payments/report/bank/?${buildParams({ bank_id: bankId !== "todos" ? bankId : "" }).toString()}`)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Relatório"}
              </Button>
            </div>
          </TabsContent>

          {/* Balancete */}
          <TabsContent value="balancete">
            <Card><CardContent className="p-4 grid gap-2">
              <div>
                <label className="text-xs">Data Inicial</label>
                <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="max-w-[150px]" />
              </div>
              <div>
                <label className="text-xs">Data Final</label>
                <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="max-w-[150px]" />
              </div>
            </CardContent></Card>
            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <Button onClick={() => handleOpenPdf(`${API_URL}/payments/report/chartaccount/?${buildParams().toString()}`)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Balancete"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="quadro">
            <Card>
              <CardContent className="p-4 grid gap-4">
                <div>
                  <label className="text-xs">Data Inicial</label>
                  <Input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="max-w-[150px]" />
                </div>
                <div>
                  <label className="text-xs">Data Final</label>
                  <Input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="max-w-[150px]" />
                </div>

                <div>
                  <label className="text-xs block mb-1">Tipo de Relatório</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="espelho"
                        checked={reportType === "espelho"}
                        onChange={() => setReportType("espelho")}
                      />
                      Espelho
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="realizado"
                        checked={reportType === "realizado"}
                        onChange={() => setReportType("realizado")}
                      />
                      Realizado
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <Button
                onClick={() =>
                  handleOpenPdf(
                    `${API_URL}/payments/report/${reportType}/?${buildParams().toString()}`
                  )
                }
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Relatório"}
              </Button>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
