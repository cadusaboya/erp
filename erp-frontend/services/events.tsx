const API_BASE_URL = "http://127.0.0.1:8000";

export const fetchEvents = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");

    const response = await fetch(`${API_BASE_URL}/events/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Erro ao buscar eventos");

    const result = await response.json();
    return result.events; // Assuming the API returns { events: [...] }
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return [];
  }
};
