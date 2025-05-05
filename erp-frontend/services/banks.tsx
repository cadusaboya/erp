const API_BASE_URL = "http://127.0.0.1:8000"; // adjust if needed

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

export const fetchBanks = async () => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/payments/banks/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.ok ? await response.json() : [];
};

export const createBank = async (data: { name: string; balance: number }) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/payments/banks/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.ok;
};

export const updateBank = async (id: number, data: { name: string; balance: number }) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/payments/banks/${id}/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.ok;
};

export const deleteBank = async (id: number) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/payments/banks/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.ok;
};

