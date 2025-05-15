import axios from "axios";
import { API_URL } from "@/types/apiUrl";
import { getSelectedCompanyId } from "@/contexts/CompanyContext";   // ✅ read from React

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const companyId = getSelectedCompanyId();                         // ✅ perfect sync

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (companyId) config.headers["X-Company-ID"] = companyId;

  if (process.env.NODE_ENV === "development") {
    console.log("Axios Request:");
    console.log("Headers:", config.headers);
  }

  return config;
});
