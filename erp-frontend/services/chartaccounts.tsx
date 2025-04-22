import { ChartAccount } from "@/types/types";

const API_BASE_URL = "http://127.0.0.1:8000";

export const fetchChartAccounts = async (): Promise<ChartAccount[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/payments/chartaccounts/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Erro ao buscar plano de contas");
  }
  return response.json();
};
