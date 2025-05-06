import { ChartAccount } from "@/types/types";

import { API_URL } from "@/types/apiUrl";

export const fetchChartAccounts = async (): Promise<ChartAccount[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/payments/chartaccounts/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Erro ao buscar plano de contas");
  }
  return response.json();
};
