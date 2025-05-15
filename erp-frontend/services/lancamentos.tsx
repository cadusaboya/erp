import { PaymentRecord, FilterPaymentType, PaymentCreatePayload } from "@/types/types";
import { api } from "@/lib/axios";

export const fetchPayments = async (
  filters: FilterPaymentType = {},
  page: number = 1
) => {
  try {
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

    params.append("page", page.toString());

    const response = await api.get(`/payments/payments/?${params.toString()}`);
    return response.data; // ✅ { results, count }
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    return { results: [], count: 0 };
  }
};

export const createPayment = async (data: PaymentCreatePayload) => {
  try {
    const response = await api.post("/payments/payments/", data);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    throw new Error("Erro ao criar pagamento");
  }
};

export const updatePayment = async (id: number, payment: Partial<PaymentRecord>) => {
  try {
    const response = await api.patch(`/payments/payments/${id}/`, payment);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    throw new Error("Erro ao atualizar pagamento");
  }
};

export const deletePayment = async (id: number) => {
  try {
    await api.delete(`/payments/payments/${id}/`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar pagamento:", error);
    return false;
  }
};
