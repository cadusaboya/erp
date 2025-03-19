const API_BASE_URL = "http://127.0.0.1:8000";

type ResourceType = "clients" | "suppliers";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token não encontrado");
  }
  return token;
};

export const fetchResources = async (resource: ResourceType) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/clients/${resource}/`, {
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
