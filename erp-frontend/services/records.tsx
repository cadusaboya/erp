import { api } from "@/lib/axios";
import { FilterFinanceRecordType } from "@/types/types";
import { transformDates } from "@/lib/dateFormat"; // ✅ Importa função para formatar datas

// 🟢 Util para mapear person_id corretamente
const mapPersonId = (type: "bill" | "income", data: any) => {
  const mapped = {
    ...data,
    [type === "bill" ? "supplier" : "client"]: data.person_id,
  };
  delete mapped.person_id;
  return mapped;
};

export const fetchRecords = async (
  type: "bill" | "income",
  filters: FilterFinanceRecordType = {},
  page = 1
) => {
  try {
    const parsed = transformDates(filters); // ✅ Converte datas
    const params = new URLSearchParams();

    if (filters.id !== undefined) params.append("id", filters.id.toString());
    if (parsed.startDate) params.append("start_date", parsed.startDate);
    if (parsed.endDate) params.append("end_date", parsed.endDate);
    if (parsed.description) params.append("description", parsed.description);
    if (parsed.person) params.append("person", parsed.person);
    if (parsed.docNumber) params.append("doc_number", parsed.docNumber);
    if (parsed.status?.length) {
      parsed.status.forEach((s) => params.append("status", s));
    }

    params.append("page", page.toString());

    const response = await api.get(`/payments/${type}s/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar ${type}s:`, error);
    return { count: 0, results: [] };
  }
};

export const createRecord = async (type: "bill" | "income", formData: any) => {
  try {
    const payload = mapPersonId(type, transformDates(formData));
    console.log(payload)
    await api.post(`/payments/${type}s/`, payload);
    return true;
  } catch (error) {
    console.error(`Erro ao criar ${type}:`, error);
    return false;
  }
};

export const updateRecord = async (
  type: "bill" | "income",
  recordId: number,
  updatedData: any
) => {
  try {
    const payload = mapPersonId(type, transformDates(updatedData));
    await api.put(`/payments/${type}s/${recordId}/`, payload);
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar ${type}:`, error);
    return false;
  }
};

export const deleteRecord = async (type: "bill" | "income", recordId: number) => {
  try {
    await api.delete(`/payments/${type}s/${recordId}/`);
    return true;
  } catch (error) {
    console.error(`Erro ao deletar ${type}:`, error);
    return false;
  }
};
