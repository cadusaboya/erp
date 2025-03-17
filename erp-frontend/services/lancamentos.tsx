const API_BASE_URL = "http://127.0.0.1:8000";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

export const fetchOrders = async () => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/payments/entries/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar ordens de pagamento");
    }

    const result = await response.json();
    return result; // Assuming the API returns { events: [...] }
  } catch (error) {
    console.error("Erro ao buscar ordens de pagamento:", error);
    return [];
  }
};

export const createOrder = async (formData: any) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/payments/entries/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error(`Erro ao criar lançamento`);

    return true;
  } catch (error) {
    console.error(`Erro ao criar lançamento:`, error);
    return false;
  }
};

export const updateOrder = async (orderId: number, updatedData: any) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/payments/entries/${orderId}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) throw new Error(`Erro ao atualizar ordem`);

    return true;
  } catch (error) {
    console.error("Erro ao atualizar ordem:", error);
    return false;
  }
};
