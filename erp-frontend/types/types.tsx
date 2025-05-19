export interface PaymentCreatePayload {
  [key: string]: unknown; // ✅ this fixes the error
  bill_id?: number;
  income_id?: number;
  description?: string;
  value: string;
  date?: string;
  scheduled_date?: string;
  bank?: number;
  doc_number: string;
  status: "pago" | "agendado";
}

export interface PaymentFormData {
  value: string;
  date: string;
  doc_number: string;
  description: string;
  bank: string;
}

export interface RateioItem {
  id?: number;
  event?: string;
  chart_account?: string;
  value: string;
}

export interface PaymentRecord {
  id: number;
  bill_id?: number;              // ✅ Novo
  income_id?: number;            // ✅ Novo
  description?: string;
  date: string;
  value: string;
  bank?: number;
  bank_name?: string;         // ✅ Corrigido para string
  doc_number: string;
  person_name: string | null;
  person_type: "supplier" | "client" | null;
  status: "pago" | "agendado";
}

export interface FilterPaymentType {
  [key: string]: unknown; // ✅ this fixes the error
  id?: number;
  startDate?: string;
  endDate?: string;
  person?: string;
  minValue?: string;
  maxValue?: string;
  type?: string[];
  bank_name?: string[];
  bill_id?: number;
  income_id?: number;
  status?: string[];
}


  
  export type FilterFinanceRecordType = {
    id?: number;
    startDate?: string;
    endDate?: string;
    person?: string;
    description?: string;
    status?: string[];
    type?: string[];
    bank_name?: string[];
    docNumber?: string;
    minValue?: string;
    maxValue?: string;
  };

  export type FiltersEventType = {
    id?: number;
    event_name?: string;
    client?: string;
    type?: string[];
    startDate?: string;
    endDate?: string;
    minValue?: string;
    maxValue?: string;
  };

  export interface FiltersClientType {
    id?: number;
    name?: string;
    cpf_cnpj?: string;
    email?: string;
    telephone?: string;
  }

  export interface FinanceRecord {
    id?: number;
    type?: string;
    person_name: string;
    person: number; // used by the form
    description: string;
    date_due: string;
    date?: string;
    value: string;
    remaining_value?: string;
    cost_center: number;
    doc_number?: string;
    event?: string | null;
    status: "em aberto" | "pago" | "vencido" | "parcial";
    bank?: number;
    bank_name: string;
    payment_doc_number?: number;
    event_allocations?: RateioItem[];
    account_allocations?: RateioItem[];
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

  export interface ChartAccount {
    id: number;
    code: string;
    description: string;
  }

  export interface CostCenter {
    id: number;
    name: string;
  }