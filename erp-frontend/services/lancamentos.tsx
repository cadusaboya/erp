import { PaymentRecord, FilterPaymentType, PaymentCreatePayload } from "@/types/types";
import { api } from "@/lib/axios";
import { transformDates } from "@/lib/dateFormat";

export const fetchPayments = async (
  filters: FilterPaymentType = {},
  page: number = 1
) => {
  try {
    const parsed = transformDates(filters);
    const params = new URLSearchParams();

    if (parsed.startDate) params.append("startDate", parsed.startDate);
    if (filters.id !== undefined) params.append("id", filters.id.toString());
    if (parsed.endDate) params.append("endDate", parsed.endDate);
    if (parsed.person) params.append("person", parsed.person);
    if (parsed.minValue) params.append("minValue", parsed.minValue);
    if (parsed.maxValue) params.append("maxValue", parsed.maxValue);

    if (parsed.type && parsed.type.length > 0) {
      parsed.type.forEach((t: string) => params.append("type", t));
    }

    if (parsed.bank_name && parsed.bank_name.length > 0) {
      parsed.bank_name.forEach((b: string) => params.append("bank_name", b));
    }

    if (parsed.bill_id) params.append("bill_id", parsed.bill_id.toString());
    if (parsed.income_id) params.append("income_id", parsed.income_id.toString());

    params.append("page", page.toString());

    const response = await api.get(`/payments/payments/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    return { results: [], count: 0 };
  }
};

export const createPayment = async (data: PaymentCreatePayload) => {
  try {
    console.log(transformDates(data));
    const response = await api.post("/payments/payments/", transformDates(data));
    return response.data;
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    throw new Error("Erro ao criar pagamento");
  }
};

export const updatePayment = async (id: number, payment: Partial<PaymentRecord>) => {
  try {
    const response = await api.patch(`/payments/payments/${id}/`, transformDates(payment));
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
