import { api } from "@/lib/axios";

type Bank = {
  name: string;
  balance: number;
};

export const fetchBanks = async () => {
  try {
    const response = await api.get("/payments/banks/");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar bancos:", error);
    return [];
  }
};

export const createBank = async (data: Bank) => {
  try {
    await api.post("/payments/banks/", data);
    return true;
  } catch (error) {
    console.error("Erro ao criar banco:", error);
    return false;
  }
};

export const updateBank = async (id: number, data: Bank) => {
  try {
    await api.put(`/payments/banks/${id}/`, data);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar banco:", error);
    return false;
  }
};

export const deleteBank = async (id: number) => {
  try {
    await api.delete(`/payments/banks/${id}/`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar banco:", error);
    return false;
  }
};
