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

export const fetchRecords = async (type: "bill" | "income", filters: FilterFinanceRecordType = {}) => {
  try {
    const token = getToken();

    // Build query params dynamically
    const params = new URLSearchParams();

    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.description) params.append("description", filters.description);
    if (filters.person) params.append("person", filters.person);
    if (filters.docNumber) params.append("doc_number", filters.docNumber);
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((s) => params.append("status", s));
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Erro ao buscar ${type}s`);
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar ${type}s:`, error);
    return [];
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
