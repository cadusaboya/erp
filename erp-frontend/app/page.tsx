"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = "http://127.0.0.1:8000/accounts"; // Adjust to your Django backend

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isRegistering) {
        // Register a new user
        await axios.post(`${API_URL}/register/`, {
          username,
          password,
        });
        setMessage("User registered successfully! You can now log in.");
      } else {
        // Login existing user
        const response = await axios.post(`${API_URL}/login/`, {
          username,
          password,
        });

        const token = response.data.token; // Ensure backend returns an "token" token
        if (!token) throw new Error("Token not received");

        localStorage.setItem("token", token);
        setMessage("Login successful! Redirecting...");
        setTimeout(() => (window.location.href = "/dashboard"), 1000);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "An error occurred.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="w-96 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{isRegistering ? "Create an Account" : "Login"}</h2>

        {message && <p className="text-red-500 mb-4">{message}</p>}

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
