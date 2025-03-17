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

export const createEvent = async (eventData: any) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token not found");
    }

    const response = await fetch(`${API_BASE_URL}/events/create/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error("Error creating event");
    }

    return true;
  } catch (error) {
    console.error("Error creating event:", error);
    return false;
  }
};

export const updateEvent = async (eventId: number, updatedData: any) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado");
    }

    const response = await fetch(`${API_BASE_URL}/events/${eventId}/update/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar evento");
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return false;
  }
};
