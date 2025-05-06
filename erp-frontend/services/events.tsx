import { FiltersEventType } from "@/types/types";

const API_BASE_URL = "http://127.0.0.1:8000";

export const fetchEvents = async (
  filters: FiltersEventType = {},
  page: number = 1,
  pageSize: number = 12
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");

    const params = new URLSearchParams();

    if (filters.event_name) params.append("event_name", filters.event_name);
    if (filters.client) params.append("client", filters.client);
    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.minValue) params.append("min_value", filters.minValue);
    if (filters.maxValue) params.append("max_value", filters.maxValue);
    if (filters.type && filters.type.length > 0) {
      filters.type.forEach((t) => params.append("type", t));
    }

    // ✅ Paginação
    params.append("page", page.toString());

    const response = await fetch(`${API_BASE_URL}/events/?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Erro ao buscar eventos");

    return await response.json(); // ✅ Esperado: { results: [...], count: N }
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return { results: [], count: 0 };
  }
};


export const createEvent = async (eventData: any) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token not found");
    }

    const response = await fetch(`${API_BASE_URL}/events/`, {
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

    const response = await fetch(`${API_BASE_URL}/events/${eventId}/`, {
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

export const deleteEvent = async (eventId: number) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado");
    }

    const response = await fetch(`${API_BASE_URL}/events/${eventId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar evento");
    }

    return true;
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    return false;
  }
};

export const fetchSingleEvent = async (id: number | string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");

  const response = await fetch(`${API_BASE_URL}/events/${id}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Erro ao buscar evento");

  return await response.json();
};