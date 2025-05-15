import { api } from "@/lib/axios";
import { ChartAccount } from "@/types/types";

export const fetchChartAccounts = async (): Promise<ChartAccount[]> => {
  try {
    const response = await api.get<ChartAccount[]>("/payments/chartaccounts/");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar plano de contas:", error);
    throw new Error("Erro ao buscar plano de contas");
  }
};
