const API_BASE_URL = "http://127.0.0.1:8000";

export const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const response = await fetch(`${API_BASE_URL}/clients/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar clientes");
      }

      const result = await response.json();
      return result.clients;
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      return [];
    }
  };

export const updateClient = async (clientId: number, updatedData: any) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado");
    }

    const response = await fetch(`${API_BASE_URL}/clients/${clientId}/update/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar cliente");
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return false;
  }
};

export const createClient = async (clientData: any) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado");
    }

    const response = await fetch(`${API_BASE_URL}/clients/create/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar cliente");
    }

    return true;
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return false;
  }
};
