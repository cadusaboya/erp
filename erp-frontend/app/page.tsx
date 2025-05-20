"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { API_URL } from "@/types/apiUrl";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.post(`${API_URL}/accounts/login/`, {
        username,
        password,
      });

      const token = response.data.token;
      if (!token) throw new Error("Token not received");

      localStorage.setItem("token", token);
      setMessage("Login successful! Redirecting...");
      setTimeout(() => (window.location.href = "/dashboard"), 1000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login error:", error.message);
      }
      setMessage("Login failed. Check your credentials.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="w-96 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {message && <p className="text-red-500 mb-4 text-sm whitespace-pre-wrap">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 mb-2 border border-gray-300 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 mb-2 border border-gray-300 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
