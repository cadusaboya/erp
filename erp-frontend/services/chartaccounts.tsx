import { api } from "@/lib/axios";
import { ChartAccount } from "@/types/types";

export const fetchChartAccounts = async (leafOnly = false): Promise<ChartAccount[]> => {
  try {
    const params = leafOnly ? { leaf_only: "true" } : {};
    const response = await api.get<ChartAccount[]>("/payments/chartaccounts/", { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar plano de contas:", error);
    throw new Error("Erro ao buscar plano de contas");
  }
};
