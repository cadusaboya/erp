const API_BASE_URL = "http://127.0.0.1:8000";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

// ✅ Fetch all records (bills or incomes)
export const fetchRecords = async (type: "bill" | "income") => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Erro ao buscar ${type}s`);

    const result = await response.json();
    return result; // bills or incomes
  } catch (error) {
    console.error(`Erro ao buscar ${type}s:`, error);
    return [];
  }
};

// ✅ Create a new record (bill or income)
export const createRecord = async (type: "bill" | "income", formData: any) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error(`Erro ao criar ${type}`);

    return true;
  } catch (error) {
    console.error(`Erro ao criar ${type}:`, error);
    return false;
  }
};

// ✅ Update an existing record (bill or income)
export const updateRecord = async (type: "bill" | "income", recordId: number, updatedData: any) => {
  try {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/${recordId}/`, {
      method: "PUT", // Or "PATCH" if you only want to update specific fields
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) throw new Error(`Erro ao atualizar ${type}`);

    return true;
  } catch (error) {
    console.error(`Erro ao atualizar ${type}:`, error);
    return false;
  }
};
