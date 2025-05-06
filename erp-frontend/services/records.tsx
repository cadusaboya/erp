const API_BASE_URL = "http://127.0.0.1:8000";

import { FilterFinanceRecordType } from "@/types/types";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

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
    const token = getToken();

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

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Erro ao buscar ${type}s`);

    return await response.json(); // Will return { count, next, previous, results }
  } catch (error) {
    console.error(`Erro ao buscar ${type}s:`, error);
    return { count: 0, results: [] }; // safer fallback
  }
};


// ✅ Create record (bill or income)
export const createRecord = async (type: "bill" | "income", formData: any) => {
  try {
    const token = getToken();
    const payload = mapPersonId(type, formData);

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Erro ao criar ${type}`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar ${type}:`, error);
    return false;
  }
};

// ✅ Update record (bill or income)
export const updateRecord = async (type: "bill" | "income", recordId: number, updatedData: any) => {
  try {
    const token = getToken();
    const payload = mapPersonId(type, updatedData);

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/${recordId}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Erro ao atualizar ${type}`);
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar ${type}:`, error);
    return false;
  }
};

export const deleteRecord = async (type: "bill" | "income", recordId: number) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/${recordId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`Erro ao deletar ${type}`);
    return true;
  } catch (error) {
    console.error(`Erro ao deletar ${type}:`, error);
    return false;
  }
};
