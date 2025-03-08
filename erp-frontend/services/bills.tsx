const API_BASE_URL = "http://127.0.0.1:8000";

// ✅ Fetch all bills
export const fetchBills = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");

    const response = await fetch(`${API_BASE_URL}/orders/bills/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Erro ao buscar contas");

    const result = await response.json();
    return result.bills;
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return [];
  }
};

// ✅ Create a new bill
export const createBill = async (formData: any) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");

    const response = await fetch(`${API_BASE_URL}/orders/bills/create/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error("Erro ao criar conta");

    return true;
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return false;
  }
};

// ✅ Update an existing bill
export const updateBill = async (billId: number, updatedData: any) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");

    const response = await fetch(`${API_BASE_URL}/orders/bills/${billId}/`, {
      method: "PUT", // Or "PATCH" if you only want to update specific fields
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) throw new Error("Erro ao atualizar conta");

    return true;
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return false;
  }
};
