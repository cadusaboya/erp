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
  const [costCenters, setCostCenters] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [events, setEvents] = useState([]);

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");
    return token;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const [costCentersRes, banksRes, eventsRes, clientsRes, suppliersRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/payments/costcenter/", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://127.0.0.1:8000/payments/banks/", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://127.0.0.1:8000/events/", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://127.0.0.1:8000/clients/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://127.0.0.1:8000/clients/suppliers/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
  
        setCostCenters(await costCentersRes.json());
        setBanks(await banksRes.json());
        setEvents((await eventsRes.json()).results || []);
        setClients((await clientsRes.json()).results || []);
        setSuppliers((await suppliersRes.json()).results || []);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };
    fetchData();
  }, []);
  

  const buildParams = (extraParams: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status && status !== "todos") params.append("status", status);
    if (person) params.append("person", person);
    if (eventId) params.append("event_id", eventId);
    if (costCenter && costCenter !== "todos") params.append("cost_center", costCenter);
    if (dateMin) params.append("date_min", dateMin);
    if (dateMax) params.append("date_max", dateMax);
    for (const key in extraParams) {
      params.append(key, extraParams[key]);
    }
    return params;
  };

  const handleOpenPdf = async (url: string) => {
    try {
      setIsLoading(true);
      const token = getToken();
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Erro ao gerar relatório");
  
      const blob = await res.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
  
      // Open the PDF in a new browser tab
      window.open(pdfUrl, "_blank");
  
      // Optional: revoke the object URL later to avoid memory leaks
      setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 10000); // after 10 seconds
    } catch (error) {
      alert("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="flex">
      <div className="flex flex-col p-6 gap-6 w-full">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Tabs
          defaultValue="contas"
          className="w-full"
          onValueChange={(tab) => {
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
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="contas">Contas</TabsTrigger>
            <TabsTrigger value="tipo">Receita por Tipo</TabsTrigger>
            <TabsTrigger value="custo">Centros de Custo</TabsTrigger>
            <TabsTrigger value="evento">Resumo Eventos</TabsTrigger>
            <TabsTrigger value="banco">Extrato Bancário</TabsTrigger>
            <TabsTrigger value="balancete">Balancete</TabsTrigger>
          </TabsList>

          {/* Contas */}
          <TabsContent value="contas">
            <Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs">Tipo</label>
                <Select value={type} onValueChange={(value) => {setType(value), setPerson("")}} >
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
                  options={(type === "incomes" ? clients : type === "bills" ? suppliers : []).map(p => ({
                    label: p.name,
                    value: String(p.id),
                  }))}
                  loadOptions={(query) =>
                    searchResources(type === "incomes" ? "clients" : "suppliers", query)
                  }
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
                  options={events.map(ev => ({
                    label: ev.event_name,
                    value: String(ev.id),
                  }))}
                  loadOptions={searchEvents}
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
              <Button onClick={() => handleOpenPdf(`http://127.0.0.1:8000/payments/report/?${buildParams().toString()}`)} disabled={isLoading}>
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
              <Button onClick={() => handleOpenPdf(`http://127.0.0.1:8000/events/report/type/?year=${year}`)} disabled={isLoading}>
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
              <Button onClick={() => handleOpenPdf(`http://127.0.0.1:8000/payments/report/costcenter/?${buildParams().toString()}`)} disabled={isLoading}>
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
              <Button onClick={() => handleOpenPdf(`http://127.0.0.1:8000/events/report/?${buildParams().toString()}`)} disabled={isLoading}>
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
              <Button onClick={() => handleOpenPdf(`http://127.0.0.1:8000/payments/report/bank/?${buildParams({ bank_id: bankId !== "todos" ? bankId : "" }).toString()}`)} disabled={isLoading}>
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
              <Button onClick={() => handleOpenPdf(`http://127.0.0.1:8000/payments/report/chartaccount/?${buildParams().toString()}`)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Gerar Balancete"}
              </Button>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
