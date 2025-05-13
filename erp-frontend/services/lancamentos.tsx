import { PaymentRecord, FilterPaymentType, PaymentCreatePayload } from "@/types/types";

import { API_URL } from "@/types/apiUrl";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

export const fetchPayments = async (
  filters: FilterPaymentType = {},
  page: number = 1,
) => {
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

  if (filters.bill_id) params.append("bill_id", filters.bill_id.toString());
  if (filters.income_id) params.append("income_id", filters.income_id.toString());

  // ✅ Paginação
  params.append("page", page.toString());

  const response = await fetch(`${API_URL}/payments/payments/?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erro ao buscar pagamentos");

  return await response.json(); // ✅ Esperado: { results, count }
};



export const createPayment = async (data: PaymentCreatePayload) => {
  const token = getToken();
  
  const response = await fetch(`${API_URL}/payments/payments/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Erro ao criar pagamento");

  return await response.json();
};


export const updatePayment = async (id: number, payment: Partial<PaymentRecord>) => {
  const token = getToken();

  const response = await fetch(`${API_URL}/payments/payments/${id}/`, {
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

export const deletePayment = async (id: number) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_URL}/payments/payments/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Erro ao deletar pagamento");

    return true;
  } catch (error) {
    console.error("Erro ao deletar pagamento:", error);
    return false;
  }
};
