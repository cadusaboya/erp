import { FiltersEventType } from "@/types/types";
import { api } from "@/lib/axios";

export const fetchEvents = async (
  filters: FiltersEventType = {},
  page: number = 1
) => {
  try {
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

    params.append("page", page.toString());

    const response = await api.get(`/events/?${params.toString()}`);
    return response.data; // { results: [...], count: N }
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return { results: [], count: 0 };
  }
};

export const searchEvents = async (query: string) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append("event_name", query);
    params.append("page", "1");
    params.append("page_size", "10");

    const response = await api.get(`/events/?${params.toString()}`);
    return response.data.results.map((ev: any) => ({
      label: ev.event_name,
      value: String(ev.id),
    }));
  } catch (error) {
    console.error("Erro ao buscar eventos (search):", error);
    return [];
  }
};

export const createEvent = async (eventData: any) => {
  try {
    await api.post("/events/", eventData);
    return true;
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return false;
  }
};

export const updateEvent = async (eventId: number, updatedData: any) => {
  try {
    await api.put(`/events/${eventId}/`, updatedData);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return false;
  }
};

export const deleteEvent = async (eventId: number) => {
  try {
    await api.delete(`/events/${eventId}/`);
    return true;
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    return false;
  }
};

export const fetchSingleEvent = async (id: number | string) => {
  try {
    const response = await api.get(`/events/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    throw new Error("Erro ao buscar evento");
  }
};
