"use client";

import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/types/apiUrl";
import { AxiosError } from "axios";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
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

    if (isRegistering) {
      // Register a new user
      await axios.post(`${API_URL}/accounts/register/`, {
        username,
        password,
        email,
        cpf,
        telefone,
      });
      setMessage("User registered successfully! You can now log in.");
    } else {
      // Login existing user
      const response = await axios.post(`${API_URL}/accounts/login/`, {
        username,
        password,
      });

      const token = response.data.token;
      if (!token) throw new Error("Token not received");

      localStorage.setItem("token", token);
      setMessage("Login successful! Redirecting...");
      setTimeout(() => (window.location.href = "/dashboard"), 1000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="w-96 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          {isRegistering ? "Create an Account" : "Login"}
        </h2>

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

          {isRegistering && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 mb-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
                className="w-full p-2 mb-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                className="w-full p-2 mb-2 border border-gray-300 rounded"
              />
            </>
          )}

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
            {isRegistering ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-500 underline"
          >
            {isRegistering ? "Login here" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
