export const updateContaAPI = async (updatedConta) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }
  
      const response = await fetch(`${API_BASE_URL}/orders/bills/${updatedConta.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConta),
      });
  
      if (!response.ok) {
        throw new Error("Erro ao atualizar conta");
      }
  
      return true; // Success
    } catch (error) {
      console.error("Erro ao atualizar conta:", error);
      return false; // Failure
    }
  };
  