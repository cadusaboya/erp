import { api } from "@/lib/axios";
import { FiltersClientType } from "@/types/types";

type ResourceType = "clients" | "suppliers";

export const fetchResources = async (
  resource: ResourceType,
  filters: FiltersClientType = {},
  page: number = 1
) => {
  try {
    const params = new URLSearchParams();

    if (filters.name) params.append("name", filters.name);
    if (filters.cpf_cnpj) params.append("cpf_cnpj", filters.cpf_cnpj);
    if (filters.email) params.append("email", filters.email);
    if (filters.telephone) params.append("telephone", filters.telephone);

    params.append("page", page.toString());

    const response = await api.get(`/clients/${resource}/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar ${resource}:`, error);
    return { results: [], count: 0 };
  }
};

export const updateResource = async (
  resource: ResourceType,
  resourceId: number,
  updatedData: any
) => {
  try {
    await api.put(`/clients/${resource}/${resourceId}/`, updatedData);
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar ${resource}:`, error);
    return false;
  }
};

export const createResource = async (
  resource: ResourceType,
  resourceData: any
) => {
  try {
    await api.post(`/clients/${resource}/`, resourceData);
    return true;
  } catch (error) {
    console.error(`Erro ao criar ${resource}:`, error);
    return false;
  }
};

export const deleteResource = async (
  resource: ResourceType,
  resourceId: number
) => {
  try {
    await api.delete(`/clients/${resource}/${resourceId}/`);
    return true;
  } catch (error) {
    console.error(`Erro ao deletar ${resource}:`, error);
    return false;
  }
};

export const fetchSingleResource = async (
  type: ResourceType,
  id: number | string
) => {
  try {
    const response = await api.get(`/clients/${type}/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar recurso:", error);
    throw new Error("Erro ao buscar recurso");
  }
};

export const searchResources = async (
  type: ResourceType,
  query: string
): Promise<{ label: string; value: string }[]> => {
  try {
    const params = new URLSearchParams();
    if (query) params.append("name", query);

    const response = await api.get(`/clients/${type}/?${params.toString()}`);
    return (response.data.results || []).map((item: any) => ({
      label: item.name,
      value: String(item.id),
    }));
  } catch (error) {
    console.error("Erro em searchResources:", error);
    return [];
  }
};
