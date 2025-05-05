const API_BASE_URL = "http://127.0.0.1:8000";

type ResourceType = "clients" | "suppliers";
import { FiltersClientType } from "@/types/types";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token não encontrado");
  }
  return token;
};

export const fetchResources = async (resource: ResourceType, filters: FiltersClientType = {}) => {
  try {
    const token = getToken();
    const params = new URLSearchParams();

    if (filters.name) params.append("name", filters.name);
    if (filters.cpf_cnpj) params.append("cpf_cnpj", filters.cpf_cnpj);
    if (filters.email) params.append("email", filters.email);
    if (filters.telephone) params.append("telephone", filters.telephone);

    const queryString = params.toString() ? `?${params.toString()}` : "";

    const response = await fetch(`${API_BASE_URL}/clients/${resource}/${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar ${resource}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Erro ao buscar ${resource}:`, error);
    return [];
  }
};

export const updateResource = async (
  resource: ResourceType,
  resourceId: number,
  updatedData: any
) => {
  try {
    const token = getToken();

    const response = await fetch(
      `${API_BASE_URL}/clients/${resource}/${resourceId}/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao atualizar ${resource}`);
    }

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
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/clients/${resource}/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resourceData),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar ${resource}`);
    }

    return true;
  } catch (error) {
    console.error(`Erro ao criar ${resource}:`, error);
    return false;
  }
};

export const deleteResource = async (resource: ResourceType, resourceId: number) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/clients/${resource}/${resourceId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar ${resource}`);
    }

    return true;
  } catch (error) {
    console.error(`Erro ao deletar ${resource}:`, error);
    return false;
  }
};
