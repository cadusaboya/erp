import { API_URL } from "@/types/apiUrl";

type ResourceType = "clients" | "suppliers";
import { FiltersClientType } from "@/types/types";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token não encontrado");
  }
  return token;
};

export const fetchResources = async (
  resource: ResourceType,
  filters: FiltersClientType = {},
  page: number = 1,
  pageSize: number = 12
) => {
  try {
    const token = getToken();
    const params = new URLSearchParams();

    if (filters.name) params.append("name", filters.name);
    if (filters.cpf_cnpj) params.append("cpf_cnpj", filters.cpf_cnpj);
    if (filters.email) params.append("email", filters.email);
    if (filters.telephone) params.append("telephone", filters.telephone);

    // ✅ Paginação
    params.append("page", page.toString());

    const queryString = `?${params.toString()}`;

    const response = await fetch(`${API_URL}/clients/${resource}/${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar ${resource}`);
    }

    const result = await response.json();
    return result; // Expects { results, count }
  } catch (error) {
    console.error(`Erro ao buscar ${resource}:`, error);
    return { results: [], count: 0 }; // Standard paginated fallback
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
      `${API_URL}/clients/${resource}/${resourceId}/`,
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

    const response = await fetch(`${API_URL}/clients/${resource}/`, {
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

    const response = await fetch(`${API_URL}/clients/${resource}/${resourceId}/`, {
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

export const fetchSingleResource = async (type: "clients" | "suppliers", id: number | string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_URL}/clients/${type}/${id}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erro ao buscar recurso");

  return await response.json();
};

export const searchResources = async (
  type: "clients" | "suppliers",
  query: string
): Promise<{ label: string; value: string }[]> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");

    const params = new URLSearchParams();
    if (query) params.append("name", query); // ou "name", dependendo da sua API

    const response = await fetch(`${API_URL}/clients/${type}/?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Erro ao buscar recursos");

    const data = await response.json();

    return (data.results || []).map((item: any) => ({
      label: item.name,
      value: String(item.id),
    }));
  } catch (error) {
    console.error("Erro em searchResources:", error);
    return [];
  }
};

