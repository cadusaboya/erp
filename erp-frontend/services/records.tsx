const API_BASE_URL = "http://127.0.0.1:8000";

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
};

// 🟢 Util to map person_id to correct field
const mapPersonId = (type: "bill" | "income", data: any) => {
  const mapped = {
    ...data,
    [type === "bill" ? "supplier" : "client"]: data.person_id,
  };
  delete mapped.person_id;
  return mapped;
};

// ✅ Fetch records (bills or incomes)
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
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar ${type}s:`, error);
    return [];
  }
};

// ✅ Create record (bill or income)
export const createRecord = async (type: "bill" | "income", formData: any) => {
  try {
    const token = getToken();
    const payload = mapPersonId(type, formData);

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Erro ao criar ${type}`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar ${type}:`, error);
    return false;
  }
};

// ✅ Update record (bill or income)
export const updateRecord = async (type: "bill" | "income", recordId: number, updatedData: any) => {
  try {
    const token = getToken();
    const payload = mapPersonId(type, updatedData);

    const response = await fetch(`${API_BASE_URL}/payments/${type}s/${recordId}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Erro ao atualizar ${type}`);
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar ${type}:`, error);
    return false;
  }
};
