import { FilterFinanceRecordType } from "@/types/types";

const API_BASE_URL = "http://127.0.0.1:8000";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

export const fetchOrders = async (filters: FilterFinanceRecordType = {}) => {
  try {
    const token = getToken();
    const queryParams = new URLSearchParams();

    if (filters.startDate) queryParams.append("start_date", filters.startDate);
    if (filters.endDate) queryParams.append("end_date", filters.endDate);
    if (filters.person) queryParams.append("person", filters.person);
    if (filters.description) queryParams.append("description", filters.description);
    if (filters.minValue) queryParams.append("min_value", filters.minValue);
    if (filters.maxValue) queryParams.append("max_value", filters.maxValue);
    if (filters.bank_name && filters.bank_name.length > 0) {
      filters.bank_name.forEach((s) => queryParams.append("bank_name", s)); // ✅ Append each status
    }
    if (filters.type && filters.type.length > 0) {
      filters.type.forEach((s) => queryParams.append("type", s)); // ✅ Append each status
    }

    const response = await fetch(
      `${API_BASE_URL}/payments/extract/?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Erro ao buscar lançamentos");

    const result = await response.json();
    return result.orders;
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return [];
  }
};