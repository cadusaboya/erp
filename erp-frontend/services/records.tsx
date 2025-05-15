import { api } from "@/lib/axios";
import { FilterFinanceRecordType } from "@/types/types";

// 🟢 Util to map person_id to correct field
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
    const params = new URLSearchParams();

    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.description) params.append("description", filters.description);
    if (filters.person) params.append("person", filters.person);
    if (filters.docNumber) params.append("doc_number", filters.docNumber);
    if (filters.status?.length) {
      filters.status.forEach((s) => params.append("status", s));
    }

    params.append("page", page.toString());

    const response = await api.get(`/payments/${type}s/?${params.toString()}`);
    return response.data; // { count, next, previous, results }
  } catch (error) {
    console.error(`Erro ao buscar ${type}s:`, error);
    return { count: 0, results: [] };
  }
};

export const createRecord = async (type: "bill" | "income", formData: any) => {
  try {
    const payload = mapPersonId(type, formData);
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
    const payload = mapPersonId(type, updatedData);
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
