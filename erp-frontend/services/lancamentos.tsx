import { PaymentRecord, FilterPaymentType } from "@/types/types";

const API_BASE_URL = "http://127.0.0.1:8000";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

export const fetchPayments = async (filters: FilterPaymentType = {}) => {
  const token = getToken();
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.person) params.append("person", filters.person);
  if (filters.minValue) params.append("minValue", filters.minValue);
  if (filters.maxValue) params.append("maxValue", filters.maxValue);
  
  if (filters.type && filters.type.length > 0) {
    filters.type.forEach((t) => params.append("type", t));
  }

  if (filters.bank_name && filters.bank_name.length > 0) {
    filters.bank_name.forEach((b) => params.append("bank_name", b));
  }

  // ✅ New additions:
  if (filters.content_type) params.append("content_type", filters.content_type);
  if (filters.object_id) params.append("object_id", filters.object_id.toString());

  const response = await fetch(`${API_BASE_URL}/payments/payments/?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erro ao buscar pagamentos");

  return await response.json();
};

export const createPayment = async (payment: PaymentRecord) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payment),
  });

  if (!response.ok) throw new Error("Erro ao criar pagamento");

  return await response.json();
};

export const updatePayment = async (id: number, payment: Partial<PaymentRecord>) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/payments/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payment),
  });

  if (!response.ok) throw new Error("Erro ao atualizar pagamento");

  return await response.json();
};