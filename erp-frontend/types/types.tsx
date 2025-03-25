export interface PaymentRecord {
  id: number;
  content_type: "bill" | "income";
  description?: string;
  object_id: number;
  date: string;
  value: string;
  bank?: number;
  bank_name?: number;
  doc_number: string;
  person_name: string | null;
  person_type: "supplier" | "client" | null;
}

export interface FilterPaymentType {
  startDate?: string;
  endDate?: string;
  person?: string;
  minValue?: string;
  maxValue?: string;
  type?: ("Despesa" | "Receita")[];
  bank_name?: string[];
  content_type?: "bill" | "income"; // ✅ NEW
  object_id?: number; // ✅ NEW
}
  
  export type FilterFinanceRecordType = {
    startDate: string;
    endDate: string;
    person: string;
    description: string;
    status?: string[];
    type?: string[];
    bank_name?: string[];
    docNumber?: string;
    minValue: string;
    maxValue: string;
  };

  export type FiltersEventType = {
    event_name: string;
    client: string;
    type: string[];
    startDate: string;
    endDate: string;
    minValue: string;
    maxValue: string;
  };

  export interface FiltersClientType {
    name: string;
    cpf_cnpj: string;
    email: string;
    telephone: string;
  }

  export interface FinanceRecord {
    id?: number;
    type?: string;
    person_name: string;
    person: number; // used by the form
    description: string;
    date_due: string;
    value: string;
    doc_number?: string;
    event?: string | null;
    status: "em aberto" | "pago" | "vencido";
    bank?: number;
    bank_name: string;
    payment_doc_number?: number;
  };

  export interface Event {
    id: number;
    type: string;
    event_name: string;
    client: number;
    client_name: string;
    date: string;
    total_value: string;
  };

  export interface Resource {
    id: number;
    name: string;
    email: string;
    telephone: string;
    address: string;
    cpf_cnpj: string;
  };

  export interface Bank {
    id: number;
    name: string;
    balance: string;
  };

  export interface FinancialSummary {
    total_receitas: number;
    total_despesas: number;
    saldo_evento: number;
    valor_restante_pagar: number;
  };